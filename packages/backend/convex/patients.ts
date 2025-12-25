import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import { diabetesTypes, genderTypes } from "./lib/validators";
import * as Patients from "./model/patients";

// ============================================
// Queries
// ============================================

/**
 * Gets the current authenticated patient's profile
 */
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx);
    return ctx.db.get(patient._id);
  },
});

/**
 * Gets full patient profile with recent records for dashboard
 * Fetches last 30 days of data across all metrics
 */
export const getFullProfile = query({
  args: {
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    const daysBack = args.daysBack ?? 30;

    // Calculate date range
    const now = Date.now();
    const startDate = new Date(now - daysBack * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch all related data in parallel
    const [
      profile,
      glucoseRecords,
      sleepRecords,
      stressRecords,
      dizzinessRecords,
      insulinSchedules,
      treatmentSlots,
    ] = await Promise.all([
      ctx.db.get(patient._id),
      // Glucose records
      ctx.db
        .query("glucoseRecords")
        .withIndex("by_patient_date", (q) =>
          q.eq("patientId", patient._id).gte("date", startDateStr)
        )
        .order("desc")
        .collect(),
      // Sleep records
      ctx.db
        .query("sleepRecords")
        .withIndex("by_patient_date", (q) =>
          q.eq("patientId", patient._id).gte("date", startDateStr)
        )
        .order("desc")
        .collect(),
      // Stress records
      ctx.db
        .query("stressRecords")
        .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
        .filter((q) => q.gte(q.field("recordedAt"), startDate.getTime()))
        .order("desc")
        .collect(),
      // Dizziness records
      ctx.db
        .query("dizzinessRecords")
        .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
        .filter((q) => q.gte(q.field("recordedAt"), startDate.getTime()))
        .order("desc")
        .collect(),
      // Active insulin schedules
      ctx.db
        .query("insulinSchedules")
        .withIndex("by_patient_type", (q) => q.eq("patientId", patient._id))
        .collect(),
      // Enabled treatment slots
      ctx.db
        .query("treatmentSlots")
        .withIndex("by_patient_enabled", (q) =>
          q.eq("patientId", patient._id).eq("isEnabled", true)
        )
        .collect(),
    ]);

    return {
      profile,
      glucoseRecords,
      sleepRecords,
      stressRecords,
      dizzinessRecords,
      insulinSchedules,
      treatmentSlots,
    };
  },
});

/**
 * Gets patient context for AI agent
 * Returns summary data formatted for AI prompts
 */
export const getPatientContext = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx);
    const context = await Patients.getPatientContext(ctx, patient._id, { limit: 5 });

    if (!context) {
      throw new Error("Profile not found");
    }

    // Format for the public API (without patientId and phoneNumber)
    return {
      name: context.name,
      age: context.age === "desconocida" ? context.age : `${context.age} años`,
      diabetesType: context.diabetesType,
      diagnosisYear: context.diagnosisYear,
      recentGlucometries: context.recentGlucometries,
      recentSleep: context.recentSleep,
      recentInsulin: context.recentInsulin,
    };
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Updates patient profile
 */
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    age: v.optional(v.number()),
    gender: v.optional(genderTypes),
    birthDate: v.optional(v.string()),
    diabetesType: v.optional(diabetesTypes),
    diagnosisYear: v.optional(v.number()),
    city: v.optional(v.string()),
    estrato: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    await Patients.updateProfile(ctx, patient._id, args);
    return { success: true };
  },
});

/**
 * Deletes patient account and all related data
 * WARNING: This is irreversible
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx);
    await Patients.deleteAllPatientData(ctx, patient);
    return { success: true };
  },
});
