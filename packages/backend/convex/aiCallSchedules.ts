import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

const userRoles = v.union(v.literal("patient"), v.literal("coadmin"))
const scheduleTypes = v.union(v.literal("recurring"), v.literal("specific"))
const notificationChannels = v.union(v.literal("call"), v.literal("whatsapp"))

// ============================================
// Queries
// ============================================

/**
 * Lists AI call schedules
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
 * Creates a new AI call schedule
 */
export const create = mutation({
  args: {
    callTime: v.string(), // "HH:MM"
    scheduleType: scheduleTypes,
    daysOfWeek: v.optional(v.array(v.number())), // [0-6] for recurring
    specificDates: v.optional(v.array(v.string())), // ["YYYY-MM-DD"] for specific
    callPurposes: v.array(v.string()),
    notificationChannel: notificationChannels,
    customMessage: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const scheduleId = await ctx.db.insert("aiCallSchedules", {
      patientId: patient._id,
      scheduledByClerkUserId: patient.clerkUserId,
      scheduledByRole: "patient",
      callTime: args.callTime,
      scheduleType: args.scheduleType,
      daysOfWeek: args.daysOfWeek,
      specificDates: args.specificDates,
      callPurposes: args.callPurposes,
      notificationChannel: args.notificationChannel,
      customMessage: args.customMessage,
      isActive: args.isActive ?? true,
      updatedAt: Date.now(),
    })

    return { id: scheduleId }
  },
})

/**
 * Updates an AI call schedule
 */
export const update = mutation({
  args: {
    id: v.id("aiCallSchedules"),
    callTime: v.optional(v.string()),
    daysOfWeek: v.optional(v.array(v.number())),
    specificDates: v.optional(v.array(v.string())),
    callPurposes: v.optional(v.array(v.string())),
    notificationChannel: v.optional(notificationChannels),
    customMessage: v.optional(v.string()),
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
 * Toggles schedule active status
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

    await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Deletes an AI call schedule
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

    await ctx.db.delete(args.id)

    return { success: true }
  },
})
