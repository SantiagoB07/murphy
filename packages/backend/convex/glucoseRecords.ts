import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

// ============================================
// Queries
// ============================================

/**
 * Lists glucose records with optional date filtering
 */
export const list = query({
  args: {
    startDate: v.optional(v.string()), // "YYYY-MM-DD"
    endDate: v.optional(v.string()), // "YYYY-MM-DD"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    let records = await ctx.db
      .query("glucoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .collect()

    // Apply date filters in memory if provided
    if (args.startDate) {
      records = records.filter((r) => r.date >= args.startDate!)
    }
    if (args.endDate) {
      records = records.filter((r) => r.date <= args.endDate!)
    }

    // Apply limit if provided
    if (args.limit) {
      records = records.slice(0, args.limit)
    }

    return records
  },
})

/**
 * Gets glucose records for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    return await ctx.db
      .query("glucoseRecords")
      .withIndex("by_patient_date", (q) =>
        q.eq("patientId", patient._id).eq("date", args.date)
      )
      .order("desc")
      .collect()
  },
})

/**
 * Gets recent glucose records
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const limit = args.limit ?? 10

    return await ctx.db
      .query("glucoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .take(limit)
  },
})

/**
 * Gets a single glucose record by ID
 */
export const getById = query({
  args: {
    id: v.id("glucoseRecords"),
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
 * Gets glucose statistics for a date range
 */
export const getStats = query({
  args: {
    startDate: v.string(), // "YYYY-MM-DD"
    endDate: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const records = await ctx.db
      .query("glucoseRecords")
      .withIndex("by_patient_date", (q) =>
        q.eq("patientId", patient._id)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .collect()

    if (records.length === 0) {
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        inRange: 0,
        belowRange: 0,
        aboveRange: 0,
      }
    }

    const values = records.map((r) => r.value)
    const sum = values.reduce((acc, val) => acc + val, 0)
    const average = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Count values in range (70-180 mg/dL is typical target range)
    const inRange = values.filter((v) => v >= 70 && v <= 180).length
    const belowRange = values.filter((v) => v < 70).length
    const aboveRange = values.filter((v) => v > 180).length

    return {
      count: records.length,
      average: Math.round(average),
      min,
      max,
      inRange,
      belowRange,
      aboveRange,
    }
  },
})

// ============================================
// Mutations
// ============================================

/**
 * Creates a new glucose record
 */
export const create = mutation({
  args: {
    value: v.number(),
    type: v.optional(v.string()), // "before_breakfast", "after_lunch", etc.
    date: v.string(), // "YYYY-MM-DD"
    recordedAt: v.optional(v.number()), // timestamp, defaults to now
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const recordId = await ctx.db.insert("glucoseRecords", {
      patientId: patient._id,
      value: args.value,
      type: args.type,
      date: args.date,
      recordedAt: args.recordedAt ?? Date.now(),
      notes: args.notes,
      updatedAt: Date.now(),
    })

    return { id: recordId }
  },
})

/**
 * Updates an existing glucose record
 */
export const update = mutation({
  args: {
    id: v.id("glucoseRecords"),
    value: v.optional(v.number()),
    type: v.optional(v.string()),
    date: v.optional(v.string()),
    recordedAt: v.optional(v.number()),
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

    await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Deletes a glucose record
 */
export const remove = mutation({
  args: {
    id: v.id("glucoseRecords"),
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
