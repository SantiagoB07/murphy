import { query, mutation, internalQuery, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"
import { internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { COLOMBIA_OFFSET_MS, getNowInColombia } from "./lib/validators"

/**
 * Calculates the next run time from a "HH:MM" time string.
 * The input time is interpreted as Colombia local time (UTC-5).
 * Returns a UTC timestamp for scheduling.
 * If the time has already passed today in Colombia, schedules for tomorrow.
 */
function getNextRunTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number)
  
  // Get current time in Colombia
  const nowColombia = getNowInColombia()
  
  // Build the target time in Colombia (as if it were UTC, then we'll convert)
  const targetColombia = new Date(nowColombia)
  targetColombia.setUTCHours(hours, minutes, 0, 0)
  
  // If the time has already passed today in Colombia, schedule for tomorrow
  if (targetColombia.getTime() <= nowColombia.getTime()) {
    targetColombia.setUTCDate(targetColombia.getUTCDate() + 1)
  }
  
  // Convert Colombia time back to UTC by subtracting the offset
  // (Colombia is UTC-5, so to get UTC we add 5 hours)
  const utcTimestamp = targetColombia.getTime() - COLOMBIA_OFFSET_MS
  
  return utcTimestamp
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

/**
 * Internal query to get a schedule by ID (no auth check)
 * Used by scheduled functions that don't have user context
 */
export const getByIdInternal = internalQuery({
  args: {
    id: v.id("aiCallSchedules"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})


// ============================================
// Mutations
// ============================================

/**
 * Creates a new alert schedule and schedules the first execution
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

    // First, insert the schedule record (without scheduledFunctionId)
    const scheduleId: Id<"aiCallSchedules"> = await ctx.db.insert("aiCallSchedules", {
      patientId: patient._id,
      time: args.time,
      channel: args.channel,
      type: args.type,
      frequency: args.frequency,
      isActive,
      updatedAt: Date.now(),
    })

    // Then, if active, schedule the first execution and update the record
    if (isActive) {
      const runTime = getNextRunTime(args.time)
      const funcId: Id<"_scheduled_functions"> = await ctx.scheduler.runAt(
        runTime,
        internal.agent.actions.executeScheduledAlert,
        { scheduleId }
      )
      await ctx.db.patch(scheduleId, { scheduledFunctionId: funcId })
    }

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
      // Activating: schedule a new execution
      const runTime = getNextRunTime(schedule.time)
      scheduledFunctionId = await ctx.scheduler.runAt(
        runTime,
        internal.agent.actions.executeScheduledAlert,
        { scheduleId: args.id }
      )
    } else if (!args.isActive && schedule.isActive && schedule.scheduledFunctionId) {
      // Deactivating: cancel the scheduled execution
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


// ============================================
// Internal Mutations (for scheduled functions)
// ============================================

/**
 * Reschedules a daily alert or cleans up a one-time alert after execution.
 * Called by executeScheduledAlert after the alert has been triggered.
 */
export const rescheduleOrCleanup = internalMutation({
  args: {
    scheduleId: v.id("aiCallSchedules"),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId)

    if (!schedule) {
      console.log(`[rescheduleOrCleanup] Schedule ${args.scheduleId} not found`)
      return
    }

    if (schedule.frequency === "once") {
      // Delete one-time alerts after execution
      console.log(`[rescheduleOrCleanup] Deleting one-time schedule ${args.scheduleId}`)
      await ctx.db.delete(args.scheduleId)
    } else if (schedule.frequency === "daily") {
      // Schedule next occurrence (tomorrow same time)
      const nextRunTime = getNextRunTime(schedule.time)
      console.log(`[rescheduleOrCleanup] Rescheduling daily alert ${args.scheduleId} for ${new Date(nextRunTime).toISOString()}`)

      const funcId: Id<"_scheduled_functions"> = await ctx.scheduler.runAt(
        nextRunTime,
        internal.agent.actions.executeScheduledAlert,
        { scheduleId: args.scheduleId }
      )

      await ctx.db.patch(args.scheduleId, {
        scheduledFunctionId: funcId,
        updatedAt: Date.now(),
      })
    }
  },
})
