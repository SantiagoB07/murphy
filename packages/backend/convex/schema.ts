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

const notificationChannels = v.union(
  v.literal("call"),
  v.literal("whatsapp")
);

const alertScheduleTypes = v.union(
  v.literal("glucometry"),
  v.literal("insulin"),
  v.literal("wellness"),
  v.literal("general")
);

const scheduleFrequency = v.union(
  v.literal("daily"),
  v.literal("once")
);

const callStatus = v.union(
  v.literal("initiated"),   // Llamada iniciada, esperando resultado
  v.literal("completed"),   // Llamada exitosa (≥ 20 segundos)
  v.literal("no_answer"),   // No contestaron
  v.literal("busy"),        // Línea ocupada
  v.literal("failed"),      // Error o timeout sin webhook
  v.literal("too_short")    // Llamada muy corta (< 20 segundos)
);

const glucoseSlots = v.union(
  v.literal("before_breakfast"),
  v.literal("after_breakfast"),
  v.literal("before_lunch"),
  v.literal("after_lunch"),
  v.literal("before_dinner"),
  v.literal("after_dinner")
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
    age: v.optional(v.number()),
    fullName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
  })
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_phone_number", ["phoneNumber"]),

  // Perfiles de co-administradores
  coadminProfiles: defineTable({
    clerkUserId: v.string(),
    patientId: v.id("patientProfiles"),
    fullName: v.string(),
    phoneNumber: v.string(),
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
    slot: v.optional(glucoseSlots), // Meal timing slot (e.g., "before_breakfast")
    notes: v.optional(v.string()), // Optional note
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
    time: v.string(), // "HH:MM"
    channel: notificationChannels, // "whatsapp" | "call"
    type: alertScheduleTypes, // "glucometry" | "insulin" | "wellness" | "general"
    frequency: scheduleFrequency, // "daily" | "once"
    isActive: v.boolean(),
    updatedAt: v.number(),
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
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

  // Registros de llamadas realizadas (para sistema de reintentos)
  callRecords: defineTable({
    patientId: v.id("patientProfiles"),
    scheduleId: v.optional(v.id("aiCallSchedules")), // Si fue llamada programada
    conversationId: v.string(),                      // ID de ElevenLabs
    status: callStatus,
    durationSeconds: v.optional(v.number()),
    retryCount: v.number(),                          // 0, 1, 2, 3
    alertType: v.optional(v.string()),               // glucometry, insulin, etc.
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    checkScheduledFunctionId: v.optional(v.id("_scheduled_functions")), // Para cancelar fallback
  })
    .index("by_conversation", ["conversationId"])
    .index("by_patient", ["patientId"])
    .index("by_status", ["status"]),
});
