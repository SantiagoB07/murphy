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

/**
 * Gets the stress record for a specific date (returns first record of the day)
 */
export const getByDate = query({
  args: {
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    // Calculate start and end timestamps for the given date
    const startOfDay = new Date(args.date + "T00:00:00").getTime()
    const endOfDay = new Date(args.date + "T23:59:59.999").getTime()

    const records = await ctx.db
      .query("stressRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("recordedAt"), startOfDay),
          q.lte(q.field("recordedAt"), endOfDay)
        )
      )
      .first()

    return records
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
 * Creates or updates a stress record for a given date (upsert)
 * Only one record per day is allowed - if one exists, it gets updated
 */
export const upsert = mutation({
  args: {
    level: v.number(), // 1-10 scale
    notes: v.optional(v.string()),
    date: v.string(), // "YYYY-MM-DD" - date from client to avoid timezone issues
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    // Calculate start and end timestamps for the given date
    const startOfDay = new Date(args.date + "T00:00:00").getTime()
    const endOfDay = new Date(args.date + "T23:59:59.999").getTime()

    // Check if a record exists for this date
    const existing = await ctx.db
      .query("stressRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("recordedAt"), startOfDay),
          q.lte(q.field("recordedAt"), endOfDay)
        )
      )
      .first()

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        level: args.level,
        notes: args.notes,
      })
      return { id: existing._id, updated: true }
    }

    // Create new record - use midday of the given date to avoid timezone edge cases
    const recordedAt = new Date(args.date + "T12:00:00").getTime()
    const recordId = await ctx.db.insert("stressRecords", {
      patientId: patient._id,
      level: args.level,
      notes: args.notes,
      recordedAt,
    })

    return { id: recordId, updated: false }
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
