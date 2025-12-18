import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import { slotTypes, insulinTypes } from "./lib/validators";
import * as TreatmentSlots from "./model/treatmentSlots";

// ============================================
// Queries
// ============================================

/**
 * Lists treatment slots with optional filtering
 */
export const list = query({
  args: {
    type: v.optional(slotTypes),
    enabledOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return TreatmentSlots.listByPatient(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Lists slots by type (convenience method)
 */
export const listByType = query({
  args: {
    type: slotTypes,
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return TreatmentSlots.listEnabledByType(ctx, {
      patientId: patient._id,
      type: args.type,
    });
  },
});

/**
 * Gets a single treatment slot by ID
 */
export const getById = query({
  args: {
    id: v.id("treatmentSlots"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return TreatmentSlots.loadById(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Creates a new treatment slot
 */
export const create = mutation({
  args: {
    type: slotTypes,
    scheduledTime: v.string(),
    label: v.optional(v.string()),
    expectedDose: v.optional(v.number()),
    insulinType: v.optional(insulinTypes),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return TreatmentSlots.createSlot(ctx, {
      patientId: patient._id,
      ...args,
    });
  },
});

/**
 * Updates a treatment slot
 */
export const update = mutation({
  args: {
    id: v.id("treatmentSlots"),
    scheduledTime: v.optional(v.string()),
    label: v.optional(v.string()),
    expectedDose: v.optional(v.number()),
    insulinType: v.optional(insulinTypes),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    const { id, ...updates } = args;
    return TreatmentSlots.updateSlot(ctx, {
      id,
      patientId: patient._id,
      ...updates,
    });
  },
});

/**
 * Toggles enabled status
 */
export const toggle = mutation({
  args: {
    id: v.id("treatmentSlots"),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return TreatmentSlots.toggleSlot(ctx, {
      id: args.id,
      patientId: patient._id,
      isEnabled: args.isEnabled,
    });
  },
});

/**
 * Deletes a treatment slot
 */
export const remove = mutation({
  args: {
    id: v.id("treatmentSlots"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return TreatmentSlots.deleteSlot(ctx, {
      id: args.id,
      patientId: patient._id,
    });
  },
});
