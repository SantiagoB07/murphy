"use client"

import { useMemo, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { Glucometry } from "@/types/diabetes"
import { GLUCOSE_RANGES } from "@/types/diabetes"
import { toast } from "sonner"
import {
  format,
  parseISO,
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  differenceInDays,
} from "date-fns"

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
  todayRecords: Glucometry[]
  addRecord: (value: number, notes?: string) => void
  updateRecord: (id: string, value: number, notes?: string) => void
  deleteRecord: (id: string) => void
  getRecordsByDate: (date: Date) => Glucometry[]
  getRecordsInRange: (start: Date, end: Date) => Glucometry[]
  isLoading: boolean
  isPending: boolean
}

// Helper: Convert Convex record to Glucometry
function convexToGlucometry(record: {
  _id: string
  value: number
  recordedAt: number
  notes?: string
}): Glucometry {
  return {
    id: record._id,
    value: record.value,
    timestamp: new Date(record.recordedAt).toISOString(),
    notes: record.notes,
  }
}

export function useGlucoseLog(_patientId?: string): GlucoseLogReturn {
  const queryClient = useQueryClient()

  // Fetch all glucose records from Convex
  const { data: convexRecords = [], isPending } = useQuery(
    convexQuery(api.glucoseRecords.list, {})
  )

  // Convert Convex records to Glucometry format
  const records = useMemo(
    () => convexRecords.map(convexToGlucometry),
    [convexRecords]
  )

  // Get today's records (sorted by time descending - most recent first)
  const todayRecords = useMemo(() => {
    const today = new Date()
    return records
      .filter((record) => isSameDay(parseISO(record.timestamp), today))
      .sort(
        (a, b) =>
          parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
      )
  }, [records])

  // Get records by date (sorted by time descending - most recent first)
  const getRecordsByDate = useCallback(
    (date: Date): Glucometry[] => {
      return records
        .filter((record) => isSameDay(parseISO(record.timestamp), date))
        .sort(
          (a, b) =>
            parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
        )
    },
    [records]
  )

  // Get records in range (sorted by time ascending for charts)
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

      return filtered.sort(
        (a, b) =>
          parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
      )
    },
    [records]
  )

  // Mutation to create a record
  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucoseRecords"] })
      toast.success("Glucosa registrada")
    },
    onError: () => toast.error("Error al guardar glucosa"),
  })

  // Mutation to update a record
  const updateMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucoseRecords"] })
      toast.success("Glucosa actualizada")
    },
    onError: () => toast.error("Error al actualizar glucosa"),
  })

  // Mutation to delete a record
  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.remove),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucoseRecords"] })
      toast.success("Registro eliminado")
    },
    onError: () => toast.error("Error al eliminar registro"),
  })

  // Add a new record
  const addRecord = useCallback(
    (value: number, notes?: string) => {
      const now = new Date()
      const date = format(now, "yyyy-MM-dd")

      createMutation.mutate({
        value,
        date,
        recordedAt: now.getTime(),
        notes,
      })
    },
    [createMutation]
  )

  // Update an existing record
  const updateRecord = useCallback(
    (id: string, value: number, notes?: string) => {
      updateMutation.mutate({
        id: id as any, // Type assertion needed for Convex ID
        value,
        notes,
      })
    },
    [updateMutation]
  )

  // Delete a record
  const deleteRecord = useCallback(
    (id: string) => {
      deleteMutation.mutate({
        id: id as any, // Type assertion needed for Convex ID
      })
    },
    [deleteMutation]
  )

  return {
    records,
    todayRecords,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDate,
    getRecordsInRange,
    isLoading: isPending,
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  }
}
