// Glucose feature types - frontend only

export type GlucoseSlot =
  | "before_breakfast"
  | "after_breakfast"
  | "before_lunch"
  | "after_lunch"
  | "before_dinner"
  | "after_dinner"

export type GlucoseStatus =
  | "critical_low"
  | "low"
  | "normal"
  | "high"
  | "critical_high"

export interface GlucoseFormData {
  value: number
  slot?: GlucoseSlot
  notes?: string
}

export type ViewMode = "daily" | "weekly" | "monthly" | "quarterly"

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
}

// Statistics interface for period calculations
export interface PeriodStats {
  count: number
  avg: number
  min: number
  max: number
  inRangeCount: number
  inRangePercent: number
  totalDays: number
  daysWithRecords: number
  daysWithRecordsPercent: number
  avgTakesPerDay: number
  stdDev: number
}

// Glucose ranges for color coding
export const GLUCOSE_RANGES = {
  critical_low: 54,
  low: 90,
  normal: { min: 90, max: 140 },
  preprandial: { min: 90, max: 130 },
  postprandial: { max: 140 },
  high: 140,
  critical_high: 250,
} as const

export const GLUCOSE_SLOT_LABELS: Record<GlucoseSlot, string> = {
  before_breakfast: "Antes del desayuno",
  after_breakfast: "Despues del desayuno",
  before_lunch: "Antes del almuerzo",
  after_lunch: "Despues del almuerzo",
  before_dinner: "Antes de la cena",
  after_dinner: "Despues de la cena",
}

export const GLUCOSE_SLOTS: GlucoseSlot[] = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_dinner",
  "after_dinner",
]

// Helper to get glucose status
export function getGlucoseStatus(
  value: number
): GlucoseStatus {
  if (value < GLUCOSE_RANGES.critical_low) return "critical_low"
  if (value < GLUCOSE_RANGES.low) return "low"
  if (value <= GLUCOSE_RANGES.high) return "normal"
  if (value <= GLUCOSE_RANGES.critical_high) return "high"
  return "critical_high"
}

