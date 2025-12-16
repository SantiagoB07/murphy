import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

// ============================================
// Queries
// ============================================

/**
 * Lists stress records
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
      .query("stressRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .collect()

    // Apply timestamp filters
    if (args.startTimestamp) {
      records = records.filter((r) => r.recordedAt >= args.startTimestamp!)
    }
    if (args.endTimestamp) {
      records = records.filter((r) => r.recordedAt <= args.endTimestamp!)
    }

    // Apply limit
    if (args.limit) {
      records = records.slice(0, args.limit)
    }

    return records
  },
})

/**
 * Gets a single stress record by ID
 */
export const getById = query({
  args: {
    id: v.id("stressRecords"),
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
 * Creates a new stress record
 */
export const create = mutation({
  args: {
    level: v.number(), // 1-10 scale
    notes: v.optional(v.string()),
    recordedAt: v.optional(v.number()), // timestamp, defaults to now
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const recordId = await ctx.db.insert("stressRecords", {
      patientId: patient._id,
      level: args.level,
      notes: args.notes,
      recordedAt: args.recordedAt ?? Date.now(),
    })

    return { id: recordId }
  },
})

/**
 * Updates a stress record
 */
export const update = mutation({
  args: {
    id: v.id("stressRecords"),
    level: v.optional(v.number()),
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
 * Deletes a stress record
 */
export const remove = mutation({
  args: {
    id: v.id("stressRecords"),
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
