// Wellness feature types - frontend only

export interface SleepFormData {
  hours: number
  quality: number
}

export interface StressFormData {
  level: number
  notes?: string
}

export interface DizzinessFormData {
  experienced: boolean
  severity?: number
  notes?: string
}

export type WellnessType = "sleep" | "stress" | "dizziness"

