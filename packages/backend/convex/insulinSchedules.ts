import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import { insulinTypes } from "./lib/validators";
import * as InsulinRecords from "./model/insulinRecords";

// ============================================
// Queries
// ============================================

/**
 * Gets active insulin schedules for current patient
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.listSchedulesByPatient(ctx, patient._id);
  },
});

/**
 * Gets insulin schedules by type
 */
export const getByType = query({
  args: {
    insulinType: insulinTypes,
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.listSchedulesByType(ctx, {
      patientId: patient._id,
      insulinType: args.insulinType,
    });
  },
});

/**
 * Gets a single schedule by ID
 */
export const getById = query({
  args: {
    id: v.id("insulinSchedules"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.loadScheduleById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new insulin schedule
 */
export const create = mutation({
  args: {
    insulinType: insulinTypes,
    unitsPerDose: v.number(),
    timesPerDay: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.createSchedule(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Updates an insulin schedule
 */
export const update = mutation({
  args: {
    id: v.id("insulinSchedules"),
    unitsPerDose: v.optional(v.number()),
    timesPerDay: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return InsulinRecords.updateSchedule(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Creates or updates an insulin schedule (upsert)
 */
export const upsert = mutation({
  args: {
    insulinType: insulinTypes,
    unitsPerDose: v.number(),
    timesPerDay: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.upsertSchedule(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Deletes an insulin schedule
 */
export const remove = mutation({
  args: {
    id: v.id("insulinSchedules"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.deleteSchedule(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
