import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

const insulinTypes = v.union(v.literal("rapid"), v.literal("basal"))

// ============================================
// Queries
// ============================================

/**
 * Lists insulin dose records with optional filtering
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    startTimestamp: v.optional(v.number()),
    endTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    let records = await ctx.db
      .query("insulinDoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .collect()

    // Apply timestamp filters in memory
    if (args.startTimestamp) {
      records = records.filter((r) => r.administeredAt >= args.startTimestamp!)
    }
    if (args.endTimestamp) {
      records = records.filter((r) => r.administeredAt <= args.endTimestamp!)
    }

    // Apply limit
    if (args.limit) {
      records = records.slice(0, args.limit)
    }

    return records
  },
})

/**
 * Gets recent insulin doses
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const limit = args.limit ?? 10

    return await ctx.db
      .query("insulinDoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .take(limit)
  },
})

/**
 * Gets a single dose record by ID
 */
export const getById = query({
  args: {
    id: v.id("insulinDoseRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const record = await ctx.db.get(args.id)

    if (!record) {
      throw new Error("Record not found")
    }

    // Verify ownership
    if (record.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    return record
  },
})

// ============================================
// Mutations
// ============================================

/**
 * Creates a new insulin dose record
 */
export const create = mutation({
  args: {
    dose: v.number(),
    insulinType: insulinTypes,
    scheduledTime: v.optional(v.string()), // "HH:MM"
    administeredAt: v.optional(v.number()), // timestamp, defaults to now
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const recordId = await ctx.db.insert("insulinDoseRecords", {
      patientId: patient._id,
      dose: args.dose,
      insulinType: args.insulinType,
      scheduledTime: args.scheduledTime,
      administeredAt: args.administeredAt ?? Date.now(),
      notes: args.notes,
    })

    return { id: recordId }
  },
})

/**
 * Updates an insulin dose record
 */
export const update = mutation({
  args: {
    id: v.id("insulinDoseRecords"),
    dose: v.optional(v.number()),
    insulinType: v.optional(insulinTypes),
    scheduledTime: v.optional(v.string()),
    administeredAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const record = await ctx.db.get(args.id)

    if (!record) {
      throw new Error("Record not found")
    }

    // Verify ownership
    if (record.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    const { id, ...updates } = args

    await ctx.db.patch(args.id, updates)

    return { success: true }
  },
})

/**
 * Deletes an insulin dose record
 */
export const remove = mutation({
  args: {
    id: v.id("insulinDoseRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const record = await ctx.db.get(args.id)

    if (!record) {
      throw new Error("Record not found")
    }

    // Verify ownership
    if (record.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.id)

    return { success: true }
  },
})
