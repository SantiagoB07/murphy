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

