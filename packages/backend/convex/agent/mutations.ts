import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import * as GlucoseRecords from "../model/glucoseRecords";
import * as InsulinRecords from "../model/insulinRecords";
import * as WellnessRecords from "../model/wellnessRecords";
import { getTodayDate } from "../lib/validators";

// ============================================
// Internal Mutations (thin wrappers for HTTP actions)
// ============================================

// --- Glucose ---

export const saveGlucoseRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    value: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await GlucoseRecords.createRecord(ctx, {
      patientId: args.patientId,
      value: args.value,
      date: getTodayDate(),
      notes: args.notes,
    });
    return { success: true };
  },
});

export const updateGlucoseRecord = internalMutation({
  args: {
    recordId: v.id("glucoseRecords"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    await GlucoseRecords.updateRecordInternal(ctx, {
      id: args.recordId,
      value: args.value,
    });
    return { success: true };
  },
});

// --- Insulin ---

export const saveInsulinRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    dose: v.number(),
    insulinType: v.union(v.literal("rapid"), v.literal("basal")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await InsulinRecords.createDoseRecord(ctx, {
      patientId: args.patientId,
      dose: args.dose,
      insulinType: args.insulinType,
      notes: args.notes,
    });
    return { success: true };
  },
});

export const updateInsulinRecord = internalMutation({
  args: {
    recordId: v.id("insulinDoseRecords"),
    dose: v.number(),
    insulinType: v.union(v.literal("rapid"), v.literal("basal")),
  },
  handler: async (ctx, args) => {
    await InsulinRecords.updateDoseRecordInternal(ctx, {
      id: args.recordId,
      dose: args.dose,
      insulinType: args.insulinType,
    });
    return { success: true };
  },
});

// --- Sleep ---

export const saveSleepRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    hours: v.number(),
    quality: v.number(),
  },
  handler: async (ctx, args) => {
    // Use upsert to handle one record per day
    await WellnessRecords.upsertSleepRecord(ctx, {
      patientId: args.patientId,
      hours: args.hours,
      quality: args.quality,
      date: getTodayDate(),
    });
    return { success: true };
  },
});

export const updateSleepRecord = internalMutation({
  args: {
    recordId: v.id("sleepRecords"),
    hours: v.number(),
    quality: v.number(),
  },
  handler: async (ctx, args) => {
    await WellnessRecords.updateSleepRecordInternal(ctx, {
      id: args.recordId,
      hours: args.hours,
      quality: args.quality,
    });
    return { success: true };
  },
});

// --- Stress ---

export const saveStressRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    level: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await WellnessRecords.createStressRecord(ctx, {
      patientId: args.patientId,
      level: args.level,
      notes: args.notes,
    });
    return { success: true };
  },
});

export const updateStressRecord = internalMutation({
  args: {
    recordId: v.id("stressRecords"),
    level: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await WellnessRecords.updateStressRecordInternal(ctx, {
      id: args.recordId,
      level: args.level,
      notes: args.notes,
    });
    return { success: true };
  },
});

// --- Dizziness ---

export const saveDizzinessRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    severity: v.number(),
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await WellnessRecords.createDizzinessRecord(ctx, {
      patientId: args.patientId,
      severity: args.severity,
      symptoms: args.symptoms,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
    });
    return { success: true };
  },
});

export const updateDizzinessRecord = internalMutation({
  args: {
    recordId: v.id("dizzinessRecords"),
    severity: v.number(),
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await WellnessRecords.updateDizzinessRecordInternal(ctx, {
      id: args.recordId,
      severity: args.severity,
      symptoms: args.symptoms,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
    });
    return { success: true };
  },
});
