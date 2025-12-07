/**
 * Mappers para transformar datos de Supabase al formato del frontend
 * 
 * Supabase usa snake_case y estructura plana
 * Frontend usa camelCase y estructura anidada
 */

import type { 
  Patient, 
  Glucometry, 
  InsulinDose, 
  SleepRecord, 
  Reminder,
  GlucometryType,
  TreatmentSlot,
  InsulinType
} from '@/app/types/diabetes'

// ============================================
// Supabase Types (como vienen de la DB)
// ============================================

export interface SupabasePatient {
  id: string
  name: string
  phone: string
  age: number | null
  sex: string | null
  diabetes_type: string | null
  diagnosis_year: number | null
  residence: string | null
  socioeconomic_level: number | null
  timezone: string | null
  telegram_id: string | null
  doctor_id: string | null
  created_at?: string
}

export interface SupabaseGlucometry {
  id: string
  patient_id: string
  value: number
  scheduled_time: string  // "HH:MM:SS"
  measured_at: string     // ISO timestamp
  source: string
}

export interface SupabaseInsulinDose {
  id: string
  patient_id: string
  dose: number
  unit: string
  scheduled_time: string
  administered_at: string
  source: string
}

export interface SupabaseSleepLog {
  id: string
  patient_id: string
  hours: number
  date: string
  source: string
}

export interface SupabaseSymptomLog {
  id: string
  patient_id: string
  symptom_type: 'stress' | 'dizziness'
  value: boolean
  date: string
  source: string
}

export interface SupabaseAlert {
  id: string
  patient_id: string
  alert_type: string
  scheduled_time: string
  enabled: boolean
  channel: string
}

export interface SupabaseTreatmentSchedule {
  id: string
  patient_id: string
  type: 'glucose' | 'insulin'
  scheduled_time: string          // "HH:MM:SS"
  label: string | null
  expected_dose: number | null
  insulin_type: string | null     // 'rapid' | 'basal'
  enabled: boolean
  created_at: string
}

// ============================================
// Mappers
// ============================================

/**
 * Infiere el tipo de glucometría basado en el horario
 * 
 * Franjas horarias:
 * - 05:00-08:30 → before_breakfast
 * - 08:30-11:00 → after_breakfast
 * - 11:00-13:00 → before_lunch
 * - 13:00-17:00 → after_lunch
 * - 17:00-19:30 → before_dinner
 * - 19:30-23:59 → after_dinner
 * - 00:00-05:00 → nocturnal
 */
export function inferGlucometryType(timeString: string): GlucometryType {
  // Parse time from "HH:MM:SS" or ISO timestamp
  let hours: number
  let minutes: number

  if (timeString.includes('T')) {
    // ISO timestamp
    const date = new Date(timeString)
    hours = date.getHours()
    minutes = date.getMinutes()
  } else {
    // "HH:MM:SS" format
    const parts = timeString.split(':')
    hours = parseInt(parts[0], 10)
    minutes = parseInt(parts[1], 10)
  }

  const timeInMinutes = hours * 60 + minutes

  // Define ranges in minutes from midnight
  if (timeInMinutes < 300) return 'nocturnal'           // 00:00 - 05:00
  if (timeInMinutes < 510) return 'before_breakfast'    // 05:00 - 08:30
  if (timeInMinutes < 660) return 'after_breakfast'     // 08:30 - 11:00
  if (timeInMinutes < 780) return 'before_lunch'        // 11:00 - 13:00
  if (timeInMinutes < 1020) return 'after_lunch'        // 13:00 - 17:00
  if (timeInMinutes < 1170) return 'before_dinner'      // 17:00 - 19:30
  if (timeInMinutes < 1440) return 'after_dinner'       // 19:30 - 24:00
  
  return 'random'
}

/**
 * Mapea glucometría de Supabase al formato del frontend
 */
export function mapGlucometry(g: SupabaseGlucometry): Glucometry {
  return {
    id: g.id,
    value: g.value,
    timestamp: g.measured_at,
    type: inferGlucometryType(g.measured_at),
  }
}

/**
 * Mapea dosis de insulina de Supabase al formato del frontend
 */
export function mapInsulinDose(i: SupabaseInsulinDose): InsulinDose {
  return {
    id: i.id,
    dose: i.dose,
    type: inferInsulinType(i.scheduled_time),
    timestamp: i.administered_at,
  }
}

/**
 * Infiere el tipo de insulina basado en el horario
 * - Dosis nocturnas (21:00-23:00) → basal
 * - Dosis durante el día → rapid
 */
function inferInsulinType(timeString: string): 'rapid' | 'basal' {
  let hours: number

  if (timeString.includes('T')) {
    hours = new Date(timeString).getHours()
  } else {
    hours = parseInt(timeString.split(':')[0], 10)
  }

  // Basal typically given at night (21:00-23:00)
  if (hours >= 21 && hours <= 23) {
    return 'basal'
  }
  return 'rapid'
}

/**
 * Mapea registro de sueño de Supabase al formato del frontend
 */
export function mapSleepRecord(s: SupabaseSleepLog): SleepRecord {
  return {
    id: s.id,
    hours: s.hours,
    date: s.date,
  }
}

/**
 * Mapea alerta/recordatorio de Supabase al formato del frontend
 */
export function mapReminder(a: SupabaseAlert): Reminder {
  return {
    id: a.id,
    alert_type: a.alert_type,
    scheduled_time: a.scheduled_time,
    enabled: a.enabled,
    channel: a.channel,
  }
}

/**
 * Mapea treatment schedule de Supabase al formato del frontend
 */
export function mapTreatmentSlot(t: SupabaseTreatmentSchedule): TreatmentSlot {
  return {
    id: t.id,
    type: t.type,
    scheduledTime: t.scheduled_time,
    label: t.label,
    expectedDose: t.expected_dose,
    insulinType: t.insulin_type as InsulinType | null,
    enabled: t.enabled,
  }
}

/**
 * Mapea paciente completo de Supabase al formato del frontend
 * Incluye datos relacionados (glucometrías, insulina, sueño, recordatorios, treatment schedule)
 */
export function mapPatient(
  patient: SupabasePatient,
  glucometries: SupabaseGlucometry[] = [],
  insulinDoses: SupabaseInsulinDose[] = [],
  sleepLogs: SupabaseSleepLog[] = [],
  symptomLogs: SupabaseSymptomLog[] = [],
  alerts: SupabaseAlert[] = [],
  treatmentSchedule: SupabaseTreatmentSchedule[] = []
): Patient {
  // Find today's symptoms
  const today = new Date().toISOString().split('T')[0]
  const todaySymptoms = symptomLogs.filter(s => s.date === today)
  const hasStressToday = todaySymptoms.find(s => s.symptom_type === 'stress')?.value ?? false
  const hasDizzinessToday = todaySymptoms.find(s => s.symptom_type === 'dizziness')?.value ?? false

  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    age: patient.age ?? 0,
    sex: patient.sex ?? null,
    diabetesType: (patient.diabetes_type as Patient['diabetesType']) ?? 'Tipo 2',
    diagnosisYear: patient.diagnosis_year ?? null,
    residence: patient.residence ?? null,
    estrato: patient.socioeconomic_level ?? 3,
    avatar: null,
    telegramConnected: !!patient.telegram_id,
    coadminId: null,
    // Datos relacionados mapeados
    glucometrias: glucometries.map(mapGlucometry),
    insulina: insulinDoses.map(mapInsulinDose),
    sueno: sleepLogs.map(mapSleepRecord),
    hasStressToday,
    hasDizzinessToday,
    recordatorios: alerts.map(mapReminder),
    treatmentSchedule: treatmentSchedule.map(mapTreatmentSlot),
  }
}

/**
 * Mapea paciente básico (sin datos relacionados) para listados
 */
export function mapPatientBasic(patient: SupabasePatient): Patient {
  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    age: patient.age ?? 0,
    sex: patient.sex ?? null,
    diabetesType: (patient.diabetes_type as Patient['diabetesType']) ?? 'Tipo 2',
    diagnosisYear: patient.diagnosis_year ?? null,
    residence: patient.residence ?? null,
    estrato: patient.socioeconomic_level ?? 3,
    avatar: null,
    telegramConnected: !!patient.telegram_id,
    coadminId: null,
    glucometrias: [],
    insulina: [],
    sueno: [],
    recordatorios: [],
    treatmentSchedule: [],
  }
}
