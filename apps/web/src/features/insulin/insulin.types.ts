// Insulin feature types - frontend only

export type InsulinType = "rapid" | "basal"

export interface InsulinFormData {
  dose: number
  insulinType: InsulinType
  scheduledTime?: string
  notes?: string
}

export interface InsulinScheduleData {
  insulinType: InsulinType
  unitsPerDose: number
  timesPerDay: number
}

