import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import * as GlucoseRecords from "./model/glucoseRecords";

// Glucose slot validator
const glucoseSlotValidator = v.optional(
  v.union(
    v.literal("before_breakfast"),
    v.literal("after_breakfast"),
    v.literal("before_lunch"),
    v.literal("after_lunch"),
    v.literal("before_dinner"),
    v.literal("after_dinner")
  )
);

// ============================================
// Queries
// ============================================

/**
 * Lists glucose records with optional date filtering
 */
export const list = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.listByPatient(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Gets glucose records for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.listByDate(ctx, {
      patientId: patient._id,
      date: args.date,
    });
  },
});

/**
 * Gets recent glucose records
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.getRecent(ctx, {
      patientId: patient._id,
      limit: args.limit,
    });
  },
});

/**
 * Gets a single glucose record by ID
 */
export const getById = query({
  args: {
    id: v.id("glucoseRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.loadById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

/**
 * Gets glucose statistics for a date range
 */
export const getStats = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.getStats(ctx, {
      patientId: patient._id,
      startDate: args.startDate,
      endDate: args.endDate,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new glucose record
 */
export const create = mutation({
  args: {
    value: v.number(),
    date: v.string(),
    recordedAt: v.optional(v.number()),
    slot: glucoseSlotValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.createRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Updates an existing glucose record
 */
export const update = mutation({
  args: {
    id: v.id("glucoseRecords"),
    value: v.optional(v.number()),
    date: v.optional(v.string()),
    recordedAt: v.optional(v.number()),
    slot: glucoseSlotValidator,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return GlucoseRecords.updateRecord(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Deletes a glucose record
 */
export const remove = mutation({
  args: {
    id: v.id("glucoseRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return GlucoseRecords.deleteRecord(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
