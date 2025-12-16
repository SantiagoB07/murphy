// User role - simplified to patient only for this migration
export type UserRole = "patient"

// View modes for glucose history
export type ViewMode = "daily" | "weekly" | "monthly" | "quarterly"

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
}

export type DiabetesType = "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY"

// Expanded GlucometryType with mealtime-specific types + legacy support
export type GlucometryType =
  | "before_breakfast"
  | "after_breakfast"
  | "before_lunch"
  | "after_lunch"
  | "before_dinner"
  | "after_dinner"
  // Legacy types for backward compatibility
  | "fasting"
  | "preprandial"
  | "postprandial"
  | "random"
  | "nocturnal"

export type InsulinType = "rapid" | "short" | "intermediate" | "basal" | "mixed"

export type AlertSeverity = "info" | "warning" | "critical"

export type AlertType =
  | "hypoglycemia"
  | "hyperglycemia"
  | "missed_dose"
  | "pattern"
  | "streak"
  | "reminder"

// Labels in Spanish for each glucometry type
export const GLUCOMETRY_LABELS: Record<GlucometryType, string> = {
  before_breakfast: "Antes del desayuno",
  after_breakfast: "Despues del desayuno",
  before_lunch: "Antes del almuerzo",
  after_lunch: "Despues del almuerzo",
  before_dinner: "Antes de la cena",
  after_dinner: "Despues de la cena",
  // Legacy labels
  fasting: "En ayunas",
  preprandial: "Preprandial",
  postprandial: "Postprandial",
  random: "Aleatorio",
  nocturnal: "Nocturno",
}

// Glucose ranges for color coding
export const GLUCOSE_RANGES = {
  critical_low: 54,
  low: 70,
  normal: { min: 70, max: 140 },
  preprandial: { min: 70, max: 130 },
  postprandial: { max: 180 },
  high: 180,
  critical_high: 250,
} as const

// The 6 meal time slots for daily tracking
export const MEAL_TIME_SLOTS = [
  {
    type: "before_breakfast" as GlucometryType,
    label: "Antes del desayuno",
    icon: "Sunrise",
    period: "breakfast",
  },
  {
    type: "after_breakfast" as GlucometryType,
    label: "Despues del desayuno",
    icon: "Coffee",
    period: "breakfast",
  },
  {
    type: "before_lunch" as GlucometryType,
    label: "Antes del almuerzo",
    icon: "Sun",
    period: "lunch",
  },
  {
    type: "after_lunch" as GlucometryType,
    label: "Despues del almuerzo",
    icon: "Utensils",
    period: "lunch",
  },
  {
    type: "before_dinner" as GlucometryType,
    label: "Antes de la cena",
    icon: "Sunset",
    period: "dinner",
  },
  {
    type: "after_dinner" as GlucometryType,
    label: "Despues de la cena",
    icon: "Moon",
    period: "dinner",
  },
] as const

// Helper to get glucose status
export function getGlucoseStatus(
  value: number
): "critical_low" | "low" | "normal" | "high" | "critical_high" {
  if (value < GLUCOSE_RANGES.critical_low) return "critical_low"
  if (value < GLUCOSE_RANGES.low) return "low"
  if (value <= GLUCOSE_RANGES.high) return "normal"
  if (value <= GLUCOSE_RANGES.critical_high) return "high"
  return "critical_high"
}

export interface Glucometry {
  id: string
  value: number
  timestamp: string
  type: GlucometryType
  notes?: string
}

export interface InsulinDose {
  id: string
  units: number
  type: InsulinType
  timestamp: string
  notes?: string
}

// Insulin schedule with full tracking support
export interface InsulinSchedule {
  id: string
  patientId: string
  type: "rapid" | "basal"
  timesPerDay: number
  unitsPerDose: number
  brand?: string
  effectiveFrom: string
  effectiveUntil?: string
  changeReason?: string
  orderedBy?: string
  changedByUserId?: string
  changedByRole?: "patient"
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Insulin brands for dropdowns
export const RAPID_INSULIN_BRANDS = [
  "Humalog (Lispro)",
  "NovoRapid (Aspart)",
  "Apidra (Glulisina)",
  "Fiasp",
  "Lyumjev",
  "Otra",
] as const

export const BASAL_INSULIN_BRANDS = [
  "Lantus (Glargina U100)",
  "Toujeo (Glargina U300)",
  "Levemir (Detemir)",
  "Tresiba (Degludec)",
  "Basaglar",
  "Otra",
] as const

export interface SleepRecord {
  id: string
  hours: number
  quality: number // 1-10
  date: string
}

export interface StressRecord {
  id: string
  level: number // 1-10
  timestamp: string
  notes?: string
}

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  timestamp: string
  resolved: boolean
}

// Dizziness severity labels (1-10 scale)
export const DIZZINESS_SEVERITY_LABELS: Record<number, string> = {
  1: "Muy leve",
  2: "Muy leve",
  3: "Leve",
  4: "Leve",
  5: "Moderado",
  6: "Moderado",
  7: "Fuerte",
  8: "Fuerte",
  9: "Severo",
  10: "Severo",
}

// Stress level labels (1-10 scale)
export const STRESS_LEVEL_LABELS: Record<number, string> = {
  1: "Muy relajado",
  2: "Muy relajado",
  3: "Relajado",
  4: "Relajado",
  5: "Normal",
  6: "Normal",
  7: "Estresado",
  8: "Estresado",
  9: "Muy estresado",
  10: "Muy estresado",
}

export interface DizzinessRecord {
  id: string
  experienced: boolean
  severity?: number // 1-10, only if experienced is true
  timestamp: string
  notes?: string
}

export interface Patient {
  id: string
  name: string
  age: number
  diabetesType: DiabetesType
  estrato: number
  avatar: string | null
  telegramConnected: boolean
  coadminId: string | null
  xpLevel: number
  streak: number
  glucometrias: Glucometry[]
  insulina: InsulinDose[]
  sueno: SleepRecord[]
  estres: StressRecord[]
  mareos?: DizzinessRecord[]
  alertas: Alert[]
}

export interface MockData {
  patients: Patient[]
  coadmins: Array<{
    id: string
    name: string
    patientId: string
    telegramConnected: boolean
  }>
}

// XP System types
export interface DailyXPLog {
  date: string
  baseXP: number
  finalXP: number
  slotsCompleted: number
  inRangePercent: number
  streakDays: number
  streakMultiplier: number
}

// Connected devices for settings
export interface ConnectedDevice {
  id: string
  name: string
  brand: string
  model: string
  connectedAt: string
  lastSync: string | null
  batteryLevel?: number
}
