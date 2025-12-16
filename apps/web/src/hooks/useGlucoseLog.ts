"use client"

import { useMemo, useCallback } from "react"
import type { Glucometry, GlucometryType } from "@/types/diabetes"
import { GLUCOSE_RANGES } from "@/types/diabetes"
import {
  format,
  parseISO,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  differenceInDays,
} from "date-fns"
import mockData from "@/data/mockPatients.json"

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

// Calculate statistics for a set of records
export function calculatePeriodStats(
  records: Glucometry[],
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
    records.map((r) => format(parseISO(r.timestamp), "yyyy-MM-dd"))
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

interface GlucoseLogReturn {
  records: Glucometry[]
  todayRecords: Map<GlucometryType, Glucometry>
  addRecord: (type: GlucometryType, value: number, notes?: string) => void
  updateRecord: (id: string, value: number, notes?: string) => void
  getRecordsByDate: (date: Date) => Map<GlucometryType, Glucometry>
  getRecordsInRange: (start: Date, end: Date) => Glucometry[]
  getSlotRecord: (type: GlucometryType, date?: Date) => Glucometry | undefined
  isLoading: boolean
}

export function useGlucoseLog(_patientId?: string): GlucoseLogReturn {
  // Get mock data from the JSON file
  const patient = mockData.patients[0]
  const records = patient.glucometrias as Glucometry[]

  const todayRecords = useMemo(() => {
    const map = new Map<GlucometryType, Glucometry>()
    // Just return first few records as "today's" records for demo
    records.slice(0, 4).forEach((record) => {
      map.set(record.type, record)
    })
    return map
  }, [records])

  const getRecordsByDate = useCallback(
    (date: Date): Map<GlucometryType, Glucometry> => {
      const dayRecords = new Map<GlucometryType, Glucometry>()

      records.forEach((record) => {
        const recordDate = parseISO(record.timestamp)
        if (isSameDay(recordDate, date)) {
          // Only keep the latest record for each type
          const existing = dayRecords.get(record.type)
          if (!existing || parseISO(existing.timestamp) < recordDate) {
            dayRecords.set(record.type, record)
          }
        }
      })

      // Fallback: if no records for date, show some mock data for demo
      if (dayRecords.size === 0 && isSameDay(date, new Date())) {
        records.slice(0, 4).forEach((record) => {
          dayRecords.set(record.type, record)
        })
      }

      return dayRecords
    },
    [records]
  )

  const getRecordsInRange = useCallback(
    (start: Date, end: Date): Glucometry[] => {
      const startInterval = startOfDay(start)
      const endInterval = endOfDay(end)

      const filtered = records.filter((record) => {
        const recordDate = parseISO(record.timestamp)
        return isWithinInterval(recordDate, {
          start: startInterval,
          end: endInterval,
        })
      })

      // Fallback: if no records in range, return all mock data for demo
      if (filtered.length === 0) {
        return records
      }

      return filtered.sort(
        (a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
      )
    },
    [records]
  )

  const getSlotRecord = useCallback(
    (type: GlucometryType, date: Date = new Date()): Glucometry | undefined => {
      const dayRecords = getRecordsByDate(date)
      return dayRecords.get(type)
    },
    [getRecordsByDate]
  )

  return {
    records,
    todayRecords,
    addRecord: (type, value, notes) => {
      console.log("[Mock] addRecord called", { type, value, notes })
    },
    updateRecord: (id, value, notes) => {
      console.log("[Mock] updateRecord called", { id, value, notes })
    },
    getRecordsByDate,
    getRecordsInRange,
    getSlotRecord,
    isLoading: false,
  }
}
