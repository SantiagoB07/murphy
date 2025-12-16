import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

const insulinTypes = v.union(v.literal("rapid"), v.literal("basal"))

// ============================================
// Queries
// ============================================

/**
 * Gets active insulin schedules for current patient
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx)

    return await ctx.db
      .query("insulinSchedules")
      .withIndex("by_patient_type", (q) => q.eq("patientId", patient._id))
      .collect()
  },
})

/**
 * Gets insulin schedules by type
 */
export const getByType = query({
  args: {
    insulinType: insulinTypes,
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    return await ctx.db
      .query("insulinSchedules")
      .withIndex("by_patient_type", (q) =>
        q.eq("patientId", patient._id).eq("insulinType", args.insulinType)
      )
      .collect()
  },
})

/**
 * Gets a single schedule by ID
 */
export const getById = query({
  args: {
    id: v.id("insulinSchedules"),
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
 * Creates a new insulin schedule
 */
export const create = mutation({
  args: {
    insulinType: insulinTypes,
    unitsPerDose: v.number(),
    timesPerDay: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const scheduleId = await ctx.db.insert("insulinSchedules", {
      patientId: patient._id,
      insulinType: args.insulinType,
      unitsPerDose: args.unitsPerDose,
      timesPerDay: args.timesPerDay,
      notes: args.notes,
      updatedAt: Date.now(),
    })

    return { id: scheduleId }
  },
})

/**
 * Updates an insulin schedule
 */
export const update = mutation({
  args: {
    id: v.id("insulinSchedules"),
    unitsPerDose: v.optional(v.number()),
    timesPerDay: v.optional(v.number()),
    notes: v.optional(v.string()),
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
 * Deletes an insulin schedule
 */
export const remove = mutation({
  args: {
    id: v.id("insulinSchedules"),
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
