import { z } from "zod";

// ============================================
// Zod Schemas for HTTP Action Validation
// ============================================

/**
 * Helper to create a patient ID validator
 * Patient IDs must be non-empty strings
 */
const patientIdSchema = z
  .string({ message: "patient_id es requerido" })
  .min(1, { message: "patient_id es requerido" });

/**
 * Insulin type validator
 */
const insulinTypeSchema = z.enum(["rapid", "basal"], {
  message: "insulin_type debe ser 'rapid' o 'basal'",
});

/**
 * Glucose slot validator (meal timing)
 */
const glucoseSlotSchema = z.enum([
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_dinner",
  "after_dinner",
]).optional();

// ============================================
// Glucometry Schemas
// ============================================

export const SaveGlucometrySchema = z.object({
  patient_id: patientIdSchema,
  value: z.number({ message: "value debe ser un número" }),
  slot: glucoseSlotSchema,
});

export const UpdateGlucometrySchema = z.object({
  patient_id: patientIdSchema,
  value: z.number({ message: "value debe ser un número" }),
  slot: glucoseSlotSchema,
});

// ============================================
// Insulin Schemas
// ============================================

export const SaveInsulinSchema = z.object({
  patient_id: patientIdSchema,
  dose: z.number({ message: "dose debe ser un número" }),
  insulin_type: insulinTypeSchema,
});

export const UpdateInsulinSchema = z.object({
  patient_id: patientIdSchema,
  dose: z.number({ message: "dose debe ser un número" }),
  insulin_type: insulinTypeSchema,
});

// ============================================
// Sleep Schemas
// ============================================

export const SaveSleepSchema = z.object({
  patient_id: patientIdSchema,
  hours: z.number({ message: "hours debe ser un número" }),
  quality: z.number({ message: "quality debe ser un número" }).default(5),
});

export const UpdateSleepSchema = z.object({
  patient_id: patientIdSchema,
  hours: z.number({ message: "hours debe ser un número" }),
  quality: z.number({ message: "quality debe ser un número" }).default(5),
});

// ============================================
// Stress Schemas
// ============================================

export const SaveStressSchema = z.object({
  patient_id: patientIdSchema,
  level: z.number({ message: "level debe ser un número" }),
  notes: z.string().optional(),
});

export const UpdateStressSchema = z.object({
  patient_id: patientIdSchema,
  level: z.number({ message: "level debe ser un número" }),
  notes: z.string().optional(),
});

// ============================================
// Dizziness Schemas
// ============================================

export const SaveDizzinessSchema = z.object({
  patient_id: patientIdSchema,
  severity: z.number({ message: "severity debe ser un número" }),
  symptoms: z.array(z.string()).optional(),
  duration_minutes: z.number().optional(),
  notes: z.string().optional(),
});

export const UpdateDizzinessSchema = z.object({
  patient_id: patientIdSchema,
  severity: z.number({ message: "severity debe ser un número" }),
  symptoms: z.array(z.string()).optional(),
  duration_minutes: z.number().optional(),
  notes: z.string().optional(),
});

// ============================================
// Type Exports
// ============================================

export type SaveGlucometryInput = z.infer<typeof SaveGlucometrySchema>;
export type UpdateGlucometryInput = z.infer<typeof UpdateGlucometrySchema>;
export type SaveInsulinInput = z.infer<typeof SaveInsulinSchema>;
export type UpdateInsulinInput = z.infer<typeof UpdateInsulinSchema>;
export type SaveSleepInput = z.infer<typeof SaveSleepSchema>;
export type UpdateSleepInput = z.infer<typeof UpdateSleepSchema>;
export type SaveStressInput = z.infer<typeof SaveStressSchema>;
export type UpdateStressInput = z.infer<typeof UpdateStressSchema>;
export type SaveDizzinessInput = z.infer<typeof SaveDizzinessSchema>;
export type UpdateDizzinessInput = z.infer<typeof UpdateDizzinessSchema>;
