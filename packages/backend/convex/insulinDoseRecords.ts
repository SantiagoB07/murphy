import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import { insulinTypes } from "./lib/validators";
import * as InsulinRecords from "./model/insulinRecords";

// ============================================
// Queries
// ============================================

/**
 * Lists insulin dose records with optional filtering
 */
export const list = query({
  args: {
    limit: v.optional(v.number()),
    startTimestamp: v.optional(v.number()),
    endTimestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.listDosesByPatient(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Gets recent insulin doses
 */
export const getRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.getRecentDoses(ctx, {
      patientId: patient._id,
      limit: args.limit,
    });
  },
});

/**
 * Gets a single dose record by ID
 */
export const getById = query({
  args: {
    id: v.id("insulinDoseRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.loadDoseById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new insulin dose record
 */
export const create = mutation({
  args: {
    dose: v.number(),
    insulinType: insulinTypes,
    scheduledTime: v.optional(v.string()),
    administeredAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.createDoseRecord(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Updates an insulin dose record
 */
export const update = mutation({
  args: {
    id: v.id("insulinDoseRecords"),
    dose: v.optional(v.number()),
    insulinType: v.optional(insulinTypes),
    scheduledTime: v.optional(v.string()),
    administeredAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return InsulinRecords.updateDoseRecord(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Deletes an insulin dose record
 */
export const remove = mutation({
  args: {
    id: v.id("insulinDoseRecords"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return InsulinRecords.deleteDoseRecord(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
