import type { GlucoseRecord } from "./hooks/useGlucoseRecords"

export type GlucoseRecordLike = GlucoseRecord | {
  id: string
  value: number
  timestamp: string
  slot?: string
  notes?: string
}

export function getRecordDate(record: GlucoseRecordLike): Date {
  if ("recordedAt" in record) return new Date(record.recordedAt)
  return new Date(record.timestamp)
}

export function toChartFormat(record: GlucoseRecordLike) {
  if ("recordedAt" in record) {
    return {
      id: record._id,
      value: record.value,
      timestamp: new Date(record.recordedAt).toISOString(),
      slot: record.slot,
      notes: record.notes
    }
  }
  return record
}
