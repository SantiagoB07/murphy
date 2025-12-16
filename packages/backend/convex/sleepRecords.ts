import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

// ============================================
// Queries
// ============================================

/**
 * Lists sleep records
 */
export const list = query({
  args: {
    startDate: v.optional(v.string()), // "YYYY-MM-DD"
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    let records = await ctx.db
      .query("sleepRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
      .order("desc")
      .collect()

    // Apply date filters in memory
    if (args.startDate) {
      records = records.filter((r) => r.date >= args.startDate!)
    }
    if (args.endDate) {
      records = records.filter((r) => r.date <= args.endDate!)
    }

    // Apply limit
    if (args.limit) {
      records = records.slice(0, args.limit)
    }

    return records
  },
})

/**
 * Gets sleep record for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    return await ctx.db
      .query("sleepRecords")
      .withIndex("by_patient_date", (q) =>
        q.eq("patientId", patient._id).eq("date", args.date)
      )
      .unique()
  },
})

/**
 * Gets a single sleep record by ID
 */
export const getById = query({
  args: {
    id: v.id("sleepRecords"),
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
 * Creates a new sleep record
 */
export const create = mutation({
  args: {
    hours: v.number(),
    quality: v.number(), // 1-10 scale
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    // Check if a record already exists for this date
    const existing = await ctx.db
      .query("sleepRecords")
      .withIndex("by_patient_date", (q) =>
        q.eq("patientId", patient._id).eq("date", args.date)
      )
      .unique()

    if (existing) {
      throw new Error("A sleep record already exists for this date")
    }

    const recordId = await ctx.db.insert("sleepRecords", {
      patientId: patient._id,
      hours: args.hours,
      quality: args.quality,
      date: args.date,
    })

    return { id: recordId }
  },
})

/**
 * Updates a sleep record
 */
export const update = mutation({
  args: {
    id: v.id("sleepRecords"),
    hours: v.optional(v.number()),
    quality: v.optional(v.number()),
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
 * Deletes a sleep record
 */
export const remove = mutation({
  args: {
    id: v.id("sleepRecords"),
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
