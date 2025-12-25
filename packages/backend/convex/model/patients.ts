import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { formatRelativeTime } from "../lib/validators";

// ============================================
// Patient Profile Helpers
// ============================================

/**
 * Loads a patient profile by ID
 * @throws Error if patient not found
 */
export async function loadById(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"patientProfiles">> {
  const patient = await ctx.db.get(patientId);
  if (!patient) {
    throw new Error("Paciente no encontrado");
  }
  return patient;
}

/**
 * Loads a patient profile by ID, returns null if not found
 */
export async function loadByIdOrNull(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"patientProfiles"> | null> {
  return ctx.db.get(patientId);
}

/**
 * Loads a patient profile by Clerk user ID
 * @throws Error if patient not found
 */
export async function loadByClerkUserId(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string
): Promise<Doc<"patientProfiles">> {
  const patient = await ctx.db
    .query("patientProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();

  if (!patient) {
    throw new Error("Perfil de paciente no encontrado");
  }
  return patient;
}

/**
 * Loads a patient profile by Clerk user ID, returns null if not found
 */
export async function loadByClerkUserIdOrNull(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string
): Promise<Doc<"patientProfiles"> | null> {
  return ctx.db
    .query("patientProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

// ============================================
// Patient Context (for AI/Dashboard)
// ============================================

export type PatientContext = {
  patientId: Id<"patientProfiles">;
  name: string;
  age: string;
  diabetesType: string;
  diagnosisYear: string;
  phoneNumber?: string;
  recentGlucometries: string;
  recentSleep: string;
  recentInsulin: string;
};

/**
 * Gets patient context formatted for AI agents and dashboards
 * Includes recent records from glucose, sleep, and insulin
 */
export async function getPatientContext(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">,
  options?: { limit?: number }
): Promise<PatientContext | null> {
  const profile = await ctx.db.get(patientId);
  if (!profile) {
    return null;
  }

  const limit = options?.limit ?? 10;

  // Fetch recent records in parallel
  const [recentGlucose, recentSleep, recentInsulinDoses] = await Promise.all([
    ctx.db
      .query("glucoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(limit),
    ctx.db
      .query("sleepRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(limit),
    ctx.db
      .query("insulinDoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
      .order("desc")
      .take(limit),
  ]);

  // Format glucose readings
  const formattedGlucose =
    recentGlucose.length > 0
      ? recentGlucose
          .map((g) => `${g.value} mg/dL (${formatRelativeTime(g.recordedAt)})`)
          .join(", ")
      : "Sin registros";

  // Format sleep logs
  const formattedSleep =
    recentSleep.length > 0
      ? recentSleep
          .map((s) => `${s.hours} horas (${s.date})`)
          .join(", ")
      : "Sin registros";

  // Format insulin doses
  const formattedInsulin =
    recentInsulinDoses.length > 0
      ? recentInsulinDoses
          .map((i) => `${i.dose} unidades ${i.insulinType} (${formatRelativeTime(i.administeredAt)})`)
          .join(", ")
      : "Sin registros";

  return {
    patientId,
    name: profile.fullName || "Paciente",
    age: profile.age ? `${profile.age}` : "desconocida",
    diabetesType: profile.diabetesType || "no especificado",
    diagnosisYear: profile.diagnosisYear ? `${profile.diagnosisYear}` : "no especificado",
    phoneNumber: profile.phoneNumber,
    recentGlucometries: formattedGlucose,
    recentSleep: formattedSleep,
    recentInsulin: formattedInsulin,
  };
}

// ============================================
// Patient Profile Updates
// ============================================

export type ProfileUpdate = {
  fullName?: string;
  phoneNumber?: string;
  age?: number;
  gender?: "masculino" | "femenino" | "otro" | "prefiero_no_decir";
  birthDate?: string;
  diabetesType?: "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY";
  diagnosisYear?: number;
  city?: string;
  estrato?: number;
};

/**
 * Updates a patient profile
 */
export async function updateProfile(
  ctx: MutationCtx,
  patientId: Id<"patientProfiles">,
  updates: ProfileUpdate
): Promise<{ id: Id<"patientProfiles"> }> {
  await ctx.db.patch(patientId, updates);
  return { id: patientId };
}

// ============================================
// Patient Data Deletion
// ============================================

/**
 * Deletes all data associated with a patient
 * WARNING: This is irreversible
 */
export async function deleteAllPatientData(
  ctx: MutationCtx,
  patient: { _id: Id<"patientProfiles">; clerkUserId: string }
): Promise<void> {
  // Fetch all related records in parallel
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
  ]);

  // Delete all records in parallel
  await Promise.all([
    ...glucoseRecords.map((r) => ctx.db.delete(r._id)),
    ...sleepRecords.map((r) => ctx.db.delete(r._id)),
    ...stressRecords.map((r) => ctx.db.delete(r._id)),
    ...dizzinessRecords.map((r) => ctx.db.delete(r._id)),
    ...insulinSchedules.map((r) => ctx.db.delete(r._id)),
    ...insulinDoseRecords.map((r) => ctx.db.delete(r._id)),
    ...treatmentSlots.map((r) => ctx.db.delete(r._id)),
    ...aiCallSchedules.map((r) => ctx.db.delete(r._id)),
  ]);

  // Delete notification preferences
  const notifPrefs = await ctx.db
    .query("notificationPreferences")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", patient.clerkUserId))
    .unique();

  if (notifPrefs) {
    await ctx.db.delete(notifPrefs._id);
  }

  // Finally, delete the patient profile
  await ctx.db.delete(patient._id);
}

// ============================================
// Patient Creation
// ============================================

export type CreatePatientInput = {
  clerkUserId: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  gender: "masculino" | "femenino" | "otro" | "prefiero_no_decir";
  diabetesType: "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY";
  diagnosisYear?: number;
  city?: string;
  estrato?: number;
};

/**
 * Creates a new patient profile
 */
export async function createPatient(
  ctx: MutationCtx,
  input: CreatePatientInput
): Promise<{ id: Id<"patientProfiles"> }> {
  const id = await ctx.db.insert("patientProfiles", input);
  return { id };
}
