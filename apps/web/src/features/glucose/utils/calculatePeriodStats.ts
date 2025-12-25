import { format, differenceInDays, parseISO } from "date-fns"
import type { PeriodStats } from "../glucose.types"
import { GLUCOSE_RANGES } from "../glucose.types"

// Flexible interface that supports both recordedAt (number) and timestamp (string)
interface GlucoseRecordLike {
  value: number
  recordedAt?: number
  timestamp?: string
}

/**
 * Get the date from a record, supporting both recordedAt and timestamp fields
 */
function getRecordDate(record: GlucoseRecordLike): Date {
  if (record.recordedAt !== undefined) {
    return new Date(record.recordedAt)
  }
  if (record.timestamp !== undefined) {
    return parseISO(record.timestamp)
  }
  return new Date()
}

/**
 * Calculate statistics for a set of glucose records within a date range
 */
export function calculatePeriodStats(
  records: GlucoseRecordLike[],
  startDate: Date,
  endDate: Date
): PeriodStats | null {
  if (records.length === 0) return null

  const values = records.map((r) => r.value)
  const sum = values.reduce((a, b) => a + b, 0)
  const avg = sum / values.length

  // Calculate standard deviation
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2))
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(avgSquareDiff)

  // Count values in range (70-180)
  const inRangeCount = values.filter(
    (v) => v >= GLUCOSE_RANGES.low && v <= GLUCOSE_RANGES.high
  ).length

  // Calculate days in period and days with records
  const totalDays = differenceInDays(endDate, startDate) + 1

  // Get unique days with records
  const daysWithRecordsSet = new Set(
    records.map((r) => format(getRecordDate(r), "yyyy-MM-dd"))
  )
  const daysWithRecords = daysWithRecordsSet.size

  return {
    count: values.length,
    avg: Math.round(avg),
    min: Math.min(...values),
    max: Math.max(...values),
    inRangeCount,
    inRangePercent: Math.round((inRangeCount / values.length) * 100),
    totalDays,
    daysWithRecords,
    daysWithRecordsPercent: Math.round((daysWithRecords / totalDays) * 100),
    avgTakesPerDay: Math.round((values.length / totalDays) * 10) / 10,
    stdDev: Math.round(stdDev),
  }
}

