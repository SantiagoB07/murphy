import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

// ============================================
// Type Definitions
// ============================================

const diabetesTypes = v.union(
  v.literal("Tipo 1"),
  v.literal("Tipo 2"),
  v.literal("Gestacional"),
  v.literal("LADA"),
  v.literal("MODY")
)

const genderTypes = v.union(
  v.literal("masculino"),
  v.literal("femenino"),
  v.literal("otro"),
  v.literal("prefiero_no_decir")
)

// ============================================
// Queries
// ============================================

/**
 * Gets the current authenticated patient's profile
 */
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx)
    
    return await ctx.db.get(patient._id)
  },
})

/**
 * Gets full patient profile with recent records for dashboard
 * Fetches last 30 days of data across all metrics
 */
export const getFullProfile = query({
  args: {
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const daysBack = args.daysBack ?? 30
    
    // Calculate date range
    const now = Date.now()
    const startDate = new Date(now - daysBack * 24 * 60 * 60 * 1000)
    const startDateStr = startDate.toISOString().split("T")[0]
    
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
    ])

    return {
      profile,
      glucoseRecords,
      sleepRecords,
      stressRecords,
      dizzinessRecords,
      insulinSchedules,
      treatmentSlots,
    }
  },
})

/**
 * Gets patient context for AI agent
 * Returns summary data formatted for AI prompts
 */
export const getPatientContext = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx)
    const profile = await ctx.db.get(patient._id)

    if (!profile) {
      throw new Error("Profile not found")
    }

    // Get last 5 records of each type
    const limit = 5
    const [recentGlucose, recentSleep, recentInsulinDoses] = await Promise.all([
      ctx.db
        .query("glucoseRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
        .order("desc")
        .take(limit),
      ctx.db
        .query("sleepRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
        .order("desc")
        .take(limit),
      ctx.db
        .query("insulinDoseRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
        .order("desc")
        .take(limit),
    ])

    // Format relative time helper
    const formatRelativeTime = (timestamp: number): string => {
      const now = Date.now()
      const diffMs = now - timestamp
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 60) {
        return `hace ${diffMins} min`
      } else if (diffHours < 24) {
        return `hace ${diffHours}h`
      } else if (diffDays === 1) {
        return "ayer"
      } else if (diffDays < 7) {
        return `hace ${diffDays} días`
      } else {
        const date = new Date(timestamp)
        return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" })
      }
    }

    // Format glucose readings
    const formattedGlucose = recentGlucose.length > 0
      ? recentGlucose
          .map((g) => `${g.value} mg/dL (${formatRelativeTime(g.recordedAt)})`)
          .join(", ")
      : "Sin registros"

    // Format sleep logs
    const formattedSleep = recentSleep.length > 0
      ? recentSleep
          .map((s) => `${s.hours} horas, calidad ${s.quality}/10 (${s.date})`)
          .join(", ")
      : "Sin registros"

    // Format insulin doses
    const formattedInsulin = recentInsulinDoses.length > 0
      ? recentInsulinDoses
          .map((i) => `${i.dose} unidades ${i.insulinType} (${formatRelativeTime(i.administeredAt)})`)
          .join(", ")
      : "Sin registros"

    return {
      name: profile.fullName || "Paciente",
      age: profile.age ? `${profile.age} años` : "desconocida",
      diabetesType: profile.diabetesType || "no especificado",
      diagnosisYear: profile.diagnosisYear ? `${profile.diagnosisYear}` : "no especificado",
      recentGlucometries: formattedGlucose,
      recentSleep: formattedSleep,
      recentInsulin: formattedInsulin,
    }
  },
})

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
    coadminName: v.optional(v.string()),
    coadminPhone: v.optional(v.string()),
    coadminEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    await ctx.db.patch(patient._id, args)

    return { success: true }
  },
})

/**
 * Deletes patient account and all related data
 * WARNING: This is irreversible
 */
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx)

    // Delete all related records
    // Note: In production, consider soft deletes or archiving instead
    const [
      glucoseRecords,
      sleepRecords,
      stressRecords,
      dizzinessRecords,
      insulinSchedules,
      insulinDoseRecords,
      treatmentSlots,
      aiCallSchedules,
    ] = await Promise.all([
      ctx.db
        .query("glucoseRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("sleepRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("stressRecords")
        .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("dizzinessRecords")
        .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("insulinSchedules")
        .withIndex("by_patient_type", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("insulinDoseRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("treatmentSlots")
        .withIndex("by_patient_type", (q) => q.eq("patientId", patient._id))
        .collect(),
      ctx.db
        .query("aiCallSchedules")
        .withIndex("by_patient_active", (q) => q.eq("patientId", patient._id))
        .collect(),
    ])

    // Delete all records
    await Promise.all([
      ...glucoseRecords.map((r) => ctx.db.delete(r._id)),
      ...sleepRecords.map((r) => ctx.db.delete(r._id)),
      ...stressRecords.map((r) => ctx.db.delete(r._id)),
      ...dizzinessRecords.map((r) => ctx.db.delete(r._id)),
      ...insulinSchedules.map((r) => ctx.db.delete(r._id)),
      ...insulinDoseRecords.map((r) => ctx.db.delete(r._id)),
      ...treatmentSlots.map((r) => ctx.db.delete(r._id)),
      ...aiCallSchedules.map((r) => ctx.db.delete(r._id)),
    ])

    // Delete notification preferences
    const notifPrefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", patient.clerkUserId))
      .unique()

    if (notifPrefs) {
      await ctx.db.delete(notifPrefs._id)
    }

    // Finally, delete the patient profile
    await ctx.db.delete(patient._id)

    return { success: true }
  },
})
