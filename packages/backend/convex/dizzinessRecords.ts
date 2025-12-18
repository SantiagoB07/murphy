import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import * as WellnessRecords from "./model/wellnessRecords";

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
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.listDizzinessByPatient(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Gets a single dizziness record by ID
 */
export const getById = query({
  args: {
    id: v.id("dizzinessRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.loadDizzinessById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

/**
 * Gets the dizziness record for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.getDizzinessByDate(ctx, {
      patientId: patient._id,
      date: args.date,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new dizziness record
 */
export const create = mutation({
  args: {
    severity: v.number(),
    symptoms: v.array(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    recordedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.createDizzinessRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Creates or updates a dizziness record for a given date (upsert)
 */
export const upsert = mutation({
  args: {
    severity: v.number(),
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.upsertDizzinessRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

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
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return WellnessRecords.updateDizzinessRecord(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Deletes a dizziness record
 */
export const remove = mutation({
  args: {
    id: v.id("dizzinessRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.deleteDizzinessRecord(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
