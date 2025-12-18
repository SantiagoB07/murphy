import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"

/**
 * Calculates the next run time from a "HH:MM" time string.
 * If the time has already passed today, schedules for tomorrow.
 */
function getNextRunTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const now = new Date()
  const runDate = new Date(now)
  
  runDate.setHours(hours, minutes, 0, 0)
  
  // If the time has already passed today, schedule for tomorrow
  if (runDate.getTime() <= now.getTime()) {
    runDate.setDate(runDate.getDate() + 1)
  }
  
  return runDate.getTime()
}

const notificationChannels = v.union(v.literal("call"), v.literal("whatsapp"))
const alertScheduleTypes = v.union(
  v.literal("glucometry"),
  v.literal("insulin"),
  v.literal("wellness"),
  v.literal("general")
)
const scheduleFrequency = v.union(v.literal("daily"), v.literal("once"))

// ============================================
// Queries
// ============================================

/**
 * Lists AI call schedules for the current patient
 */
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    let schedules = await ctx.db
      .query("aiCallSchedules")
      .withIndex("by_patient_active", (q) => q.eq("patientId", patient._id))
      .collect()

    if (args.activeOnly) {
      schedules = schedules.filter((s) => s.isActive)
    }

    return schedules
  },
})

/**
 * Gets a single schedule by ID
 */
export const getById = query({
  args: {
    id: v.id("aiCallSchedules"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const schedule = await ctx.db.get(args.id)

    if (!schedule) {
      throw new Error("Schedule not found")
    }

    // Verify ownership
    if (schedule.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    return schedule
  },
})


// ============================================
// Mutations
// ============================================

/**
 * Creates a new alert schedule and schedules the first call
 */
export const create = mutation({
  args: {
    time: v.string(), // "HH:MM"
    channel: notificationChannels,
    type: alertScheduleTypes,
    frequency: scheduleFrequency,
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const isActive = args.isActive ?? true

    // Schedule the first call if active
    let scheduledFunctionId: Id<"_scheduled_functions"> | undefined = undefined
    if (isActive) {
      const runTime = getNextRunTime(args.time)
      const funcId: Id<"_scheduled_functions"> = await ctx.scheduler.runAt(
        runTime,
        internal.agent.actions.initiateCall,
        { patientId: patient._id }
      )
      scheduledFunctionId = funcId
    }

    const scheduleId: Id<"aiCallSchedules"> = await ctx.db.insert("aiCallSchedules", {
      patientId: patient._id,
      time: args.time,
      channel: args.channel,
      type: args.type,
      frequency: args.frequency,
      isActive,
      updatedAt: Date.now(),
      scheduledFunctionId,
    })

    return { id: scheduleId }
  },
})

/**
 * Updates an alert schedule
 */
export const update = mutation({
  args: {
    id: v.id("aiCallSchedules"),
    time: v.optional(v.string()),
    channel: v.optional(notificationChannels),
    type: v.optional(alertScheduleTypes),
    frequency: v.optional(scheduleFrequency),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const schedule = await ctx.db.get(args.id)

    if (!schedule) {
      throw new Error("Schedule not found")
    }

    // Verify ownership
    if (schedule.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    const { id, ...updates } = args

    await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Toggles schedule active status (cancels or schedules the function)
 */
export const toggle = mutation({
  args: {
    id: v.id("aiCallSchedules"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const schedule = await ctx.db.get(args.id)

    if (!schedule) {
      throw new Error("Schedule not found")
    }

    // Verify ownership
    if (schedule.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    let scheduledFunctionId = schedule.scheduledFunctionId

    if (args.isActive && !schedule.isActive) {
      // Activating: schedule a new call
      const runTime = getNextRunTime(schedule.time)
      scheduledFunctionId = await ctx.scheduler.runAt(
        runTime,
        internal.agent.actions.initiateCall,
        { patientId: patient._id }
      )
    } else if (!args.isActive && schedule.isActive && schedule.scheduledFunctionId) {
      // Deactivating: cancel the scheduled call
      await ctx.scheduler.cancel(schedule.scheduledFunctionId)
      scheduledFunctionId = undefined
    }

    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      scheduledFunctionId,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Deletes an alert schedule and cancels any pending scheduled function
 */
export const remove = mutation({
  args: {
    id: v.id("aiCallSchedules"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const schedule = await ctx.db.get(args.id)

    if (!schedule) {
      throw new Error("Schedule not found")
    }

    // Verify ownership
    if (schedule.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    // Cancel the scheduled function if it exists
    if (schedule.scheduledFunctionId) {
      await ctx.scheduler.cancel(schedule.scheduledFunctionId)
    }

    await ctx.db.delete(args.id)

    return { success: true }
  },
})
