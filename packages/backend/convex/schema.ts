import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Tipos reutilizables
const diabetesTypes = v.union(
  v.literal("Tipo 1"),
  v.literal("Tipo 2"),
  v.literal("Gestacional"),
  v.literal("LADA"),
  v.literal("MODY")
);

const genderTypes = v.union(
  v.literal("masculino"),
  v.literal("femenino"),
  v.literal("otro"),
  v.literal("prefiero_no_decir")
);

const insulinTypes = v.union(
  v.literal("rapid"),
  v.literal("basal")
);

const userRoles = v.union(
  v.literal("patient"),
  v.literal("coadmin")
);

const scheduleTypes = v.union(
  v.literal("recurring"),
  v.literal("specific")
);

const notificationChannels = v.union(
  v.literal("call"),
  v.literal("whatsapp")
);

export default defineSchema({
  // Perfiles de pacientes (datos médicos extendidos)
  patientProfiles: defineTable({
    clerkUserId: v.string(),
    diabetesType: diabetesTypes,
    diagnosisYear: v.optional(v.number()),
    birthDate: v.optional(v.string()),
    gender: v.optional(genderTypes),
    city: v.optional(v.string()),
    estrato: v.optional(v.number()),
    coadminName: v.optional(v.string()),
    coadminPhone: v.optional(v.string()),
    coadminEmail: v.optional(v.string()),
    age: v.optional(v.number()),
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  }).index("by_clerk_user", ["clerkUserId"]),

  // Perfiles de co-administradores
  coadminProfiles: defineTable({
    clerkUserId: v.string(),
    patientId: v.id("patientProfiles"),
    updatedAt: v.number(),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_patient", ["patientId"]),

  // Registros de glucosa
  glucoseRecords: defineTable({
    patientId: v.id("patientProfiles"),
    value: v.number(),
    date: v.string(), // "YYYY-MM-DD"
    recordedAt: v.number(), // Unix timestamp - used for ordering and displaying time
    notes: v.optional(v.string()), // Optional note (e.g., "antes del desayuno")
    updatedAt: v.number(),
  }).index("by_patient_date", ["patientId", "date"]),

  // Esquemas de insulina
  insulinSchedules: defineTable({
    patientId: v.id("patientProfiles"),
    insulinType: insulinTypes,
    unitsPerDose: v.number(),
    timesPerDay: v.number(),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  })
    .index("by_patient_type", ["patientId", "insulinType"]),

  // Registros de sueño
  sleepRecords: defineTable({
    patientId: v.id("patientProfiles"),
    hours: v.number(),
    quality: v.number(),
    date: v.string(),
  }).index("by_patient_date", ["patientId", "date"]),

  // Registros de estrés
  stressRecords: defineTable({
    patientId: v.id("patientProfiles"),
    level: v.number(),
    notes: v.optional(v.string()),
    recordedAt: v.number(),
  }).index("by_patient", ["patientId"]),

  // Registros de mareos
  dizzinessRecords: defineTable({
    patientId: v.id("patientProfiles"),
    severity: v.number(),
    symptoms: v.array(v.string()),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
    recordedAt: v.number(),
  }).index("by_patient", ["patientId"]),

  // Preferencias de notificaciones
  notificationPreferences: defineTable({
    clerkUserId: v.string(),
    glucoseAlerts: v.boolean(),
    hypoglycemiaAlerts: v.boolean(),
    hyperglycemiaAlerts: v.boolean(),
    medicationReminders: v.boolean(),
    measurementReminders: v.boolean(),
    dailySummary: v.boolean(),
    updatedAt: v.number(),
  }).index("by_clerk_user", ["clerkUserId"]),

  // Programación de alertas automáticas (llamadas/WhatsApp)
  aiCallSchedules: defineTable({
    patientId: v.id("patientProfiles"),
    scheduledByClerkUserId: v.string(),
    scheduledByRole: userRoles,
    callTime: v.string(),
    scheduleType: scheduleTypes,
    daysOfWeek: v.optional(v.array(v.number())),
    specificDates: v.optional(v.array(v.string())),
    callPurposes: v.array(v.string()),
    notificationChannel: notificationChannels,
    customMessage: v.optional(v.string()),
    isActive: v.boolean(),
    updatedAt: v.number(),
  }).index("by_patient_active", ["patientId", "isActive"]),

  // Registros de dosis de insulina administradas
  insulinDoseRecords: defineTable({
    patientId: v.id("patientProfiles"),
    dose: v.number(),
    insulinType: insulinTypes,
    scheduledTime: v.optional(v.string()), // "HH:MM" if linked to a schedule
    administeredAt: v.number(), // timestamp
    notes: v.optional(v.string()),
  }).index("by_patient_date", ["patientId", "administeredAt"]),

  // Slots de tratamiento configurados (horarios de glucosa/insulina)
  treatmentSlots: defineTable({
    patientId: v.id("patientProfiles"),
    type: v.union(v.literal("glucose"), v.literal("insulin")),
    scheduledTime: v.string(), // "HH:MM"
    label: v.optional(v.string()), // "Desayuno", "Almuerzo", etc.
    expectedDose: v.optional(v.number()), // for insulin slots
    insulinType: v.optional(insulinTypes),
    isEnabled: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_patient_type", ["patientId", "type"])
    .index("by_patient_enabled", ["patientId", "isEnabled"]),
});
