"use client"

import { useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { Doc } from "@murphy/backend/convex/_generated/dataModel"
import {
  parseISO,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from "date-fns"

// Re-export the document type for convenience
export type GlucoseRecord = Doc<"glucoseRecords">

interface UseGlucoseRecordsOptions {
  date?: Date
}

interface UseGlucoseRecordsReturn {
  /** All glucose records */
  records: GlucoseRecord[]
  /** Records for today only */
  todayRecords: GlucoseRecord[]
  /** Check if data is loading */
  isLoading: boolean
  /** Get records for a specific date */
  getRecordsByDate: (date: Date) => GlucoseRecord[]
  /** Get records within a date range */
  getRecordsInRange: (start: Date, end: Date) => GlucoseRecord[]
}

export function useGlucoseRecords(
  options?: UseGlucoseRecordsOptions
): UseGlucoseRecordsReturn {
  // Fetch all glucose records from Convex
  const { data: convexRecords = [], isPending } = useQuery(
    convexQuery(api.glucoseRecords.list, {})
  )

  // Get today's records (sorted by time descending - most recent first)
  const todayRecords = useMemo(() => {
    const today = new Date()
    return convexRecords
      .filter((record) => isSameDay(new Date(record.recordedAt), today))
      .sort((a, b) => b.recordedAt - a.recordedAt)
  }, [convexRecords])

  // Get records by date (sorted by time descending - most recent first)
  const getRecordsByDate = useCallback(
    (date: Date): GlucoseRecord[] => {
      return convexRecords
        .filter((record) => isSameDay(new Date(record.recordedAt), date))
        .sort((a, b) => b.recordedAt - a.recordedAt)
    },
    [convexRecords]
  )

  // Get records in range (sorted by time ascending for charts)
  const getRecordsInRange = useCallback(
    (start: Date, end: Date): GlucoseRecord[] => {
      const startInterval = startOfDay(start)
      const endInterval = endOfDay(end)

      const filtered = convexRecords.filter((record) => {
        const recordDate = new Date(record.recordedAt)
        return isWithinInterval(recordDate, {
          start: startInterval,
          end: endInterval,
        })
      })

      return filtered.sort((a, b) => a.recordedAt - b.recordedAt)
    },
    [convexRecords]
  )

  return {
    records: convexRecords,
    todayRecords,
    isLoading: isPending,
    getRecordsByDate,
    getRecordsInRange,
  }
}

