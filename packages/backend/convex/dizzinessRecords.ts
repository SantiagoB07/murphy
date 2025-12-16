import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

// ============================================
// Queries
// ============================================

/**
 * Lists dizziness records
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
      .query("dizzinessRecords")
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
 * Gets a single dizziness record by ID
 */
export const getById = query({
  args: {
    id: v.id("dizzinessRecords"),
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
 * Gets the dizziness record for a specific date (returns first record of the day)
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
      .query("dizzinessRecords")
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
 * Creates a new dizziness record
 */
export const create = mutation({
  args: {
    severity: v.number(), // 1-10 scale
    symptoms: v.array(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    recordedAt: v.optional(v.number()), // timestamp, defaults to now
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const recordId = await ctx.db.insert("dizzinessRecords", {
      patientId: patient._id,
      severity: args.severity,
      symptoms: args.symptoms,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
      recordedAt: args.recordedAt ?? Date.now(),
    })

    return { id: recordId }
  },
})

/**
 * Creates or updates a dizziness record for a given date (upsert)
 * Only one record per day is allowed - if one exists, it gets updated
 */
export const upsert = mutation({
  args: {
    severity: v.number(), // 1-10 scale (0 = no dizziness)
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
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
      .query("dizzinessRecords")
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
        severity: args.severity,
        symptoms: args.symptoms ?? existing.symptoms,
        durationMinutes: args.durationMinutes,
        notes: args.notes,
      })
      return { id: existing._id, updated: true }
    }

    // Create new record - use midday of the given date to avoid timezone edge cases
    const recordedAt = new Date(args.date + "T12:00:00").getTime()
    const recordId = await ctx.db.insert("dizzinessRecords", {
      patientId: patient._id,
      severity: args.severity,
      symptoms: args.symptoms ?? [],
      durationMinutes: args.durationMinutes,
      notes: args.notes,
      recordedAt,
    })

    return { id: recordId, updated: false }
  },
})

/**
 * Updates a dizziness record
 */
export const update = mutation({
  args: {
    id: v.id("dizzinessRecords"),
    severity: v.optional(v.number()),
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
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
 * Deletes a dizziness record
 */
export const remove = mutation({
  args: {
    id: v.id("dizzinessRecords"),
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
