import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import * as WellnessRecords from "./model/wellnessRecords";

// ============================================
// Queries
// ============================================

/**
 * Lists sleep records
 */
export const list = query({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.listSleepByPatient(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Gets sleep record for a specific date
 */
export const getByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.getSleepByDate(ctx, {
      patientId: patient._id,
      date: args.date,
    });
  },
});

/**
 * Gets a single sleep record by ID
 */
export const getById = query({
  args: {
    id: v.id("sleepRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.loadSleepById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new sleep record
 */
export const create = mutation({
  args: {
    hours: v.number(),
    quality: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.createSleepRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Creates or updates a sleep record for a given date (upsert)
 */
export const upsert = mutation({
  args: {
    hours: v.number(),
    quality: v.number(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.upsertSleepRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

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
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return WellnessRecords.updateSleepRecord(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Deletes a sleep record
 */
export const remove = mutation({
  args: {
    id: v.id("sleepRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return WellnessRecords.deleteSleepRecord(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
