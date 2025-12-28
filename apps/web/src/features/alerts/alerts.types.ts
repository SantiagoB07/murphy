// Alerts feature types - frontend only

export type AlertChannel = "whatsapp" | "call"
export type AlertScheduleType = "glucometry" | "insulin" | "wellness" | "general"
export type ScheduleFrequency = "daily" | "once"

export interface AlertSchedule {
  id: string
  time: string // "HH:MM"
  channel: AlertChannel
  type: AlertScheduleType
  frequency: ScheduleFrequency
}

export type AlertSeverity = "info" | "warning" | "critical" | "success"

export interface AlertHistoryItem {
  id: number
  type: AlertSeverity
  title: string
  time: string
  value: string
  read: boolean
}

