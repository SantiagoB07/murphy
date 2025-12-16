import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import * as Patients from "../model/patients";
import * as GlucoseRecords from "../model/glucoseRecords";
import * as InsulinRecords from "../model/insulinRecords";
import * as WellnessRecords from "../model/wellnessRecords";

// ============================================
// Internal Queries (thin wrappers for HTTP actions)
// ============================================

export const getPatientById = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return Patients.loadByIdOrNull(ctx, args.patientId);
  },
});

export const getLatestGlucoseRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return GlucoseRecords.getLatestByPatient(ctx, args.patientId);
  },
});

export const getLatestInsulinRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return InsulinRecords.getLatestDose(ctx, args.patientId);
  },
});

export const getLatestSleepRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return WellnessRecords.getLatestSleep(ctx, args.patientId);
  },
});

export const getLatestStressRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return WellnessRecords.getLatestStress(ctx, args.patientId);
  },
});

export const getLatestDizzinessRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return WellnessRecords.getLatestDizziness(ctx, args.patientId);
  },
});

/**
 * Gets patient context for AI agent calls (internal, no auth required)
 * Returns summary data formatted for ElevenLabs dynamic variables
 */
export const getPatientContextById = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return Patients.getPatientContext(ctx, args.patientId, { limit: 10 });
  },
});
