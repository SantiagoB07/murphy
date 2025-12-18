import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import * as WellnessRecords from "./model/wellnessRecords";

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
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.listStressByPatient(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Gets a single stress record by ID
 */
export const getById = query({
  args: {
    id: v.id("stressRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.loadStressById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

/**
 * Gets the stress record for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.getStressByDate(ctx, {
      patientId: patient._id,
      date: args.date,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new stress record
 */
export const create = mutation({
  args: {
    level: v.number(),
    notes: v.optional(v.string()),
    recordedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.createStressRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Creates or updates a stress record for a given date (upsert)
 */
export const upsert = mutation({
  args: {
    level: v.number(),
    notes: v.optional(v.string()),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.upsertStressRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

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
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return WellnessRecords.updateStressRecord(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Deletes a stress record
 */
export const remove = mutation({
  args: {
    id: v.id("stressRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.deleteStressRecord(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
