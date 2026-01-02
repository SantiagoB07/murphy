"use client"

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import type { SleepFormData, StressFormData, DizzinessFormData } from "../wellness.types"

interface SleepData {
  hours: number
  quality: number
}

interface StressData {
  level: number
  notes?: string
}

interface DizzinessData {
  experienced: boolean
  severity?: number
  notes?: string
}

interface UseWellnessRecordsReturn {
  /** Today's sleep record */
  todaySleep: SleepData | null
  /** Today's stress record */
  todayStress: StressData | null
  /** Today's dizziness record */
  todayDizziness: DizzinessData | null
  /** Save sleep data for today */
  saveSleep: (data: SleepFormData) => void
  /** Save stress data for today */
  saveStress: (data: StressFormData) => void
  /** Save dizziness data for today */
  saveDizziness: (data: DizzinessFormData) => void
  /** Whether data is loading */
  isLoading: boolean
  /** Sleep history records */
  sleepHistory: SleepData[]
  /** Stress history records */
  stressHistory: StressData[]
  /** Dizziness history records */
  dizzinessHistory: DizzinessData[]
}

// Helper: Get start/end of today in Unix timestamp
function getTodayRange() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = today.getTime()
  today.setHours(23, 59, 59, 999)
  const end = today.getTime()
  return { start, end }
}

export function useWellnessRecords(): UseWellnessRecordsReturn {
  const queryClient = useQueryClient()
  const t = useTranslations("Dashboard.toasts")
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])
  const { start: todayStart, end: todayEnd } = useMemo(() => getTodayRange(), [])

  // Fetch sleep records (has date field)
  const { data: sleepRecords = [], isPending: sleepLoading } = useQuery(
    convexQuery(api.sleepRecords.list, {})
  )

  // Fetch stress records (uses recordedAt timestamp)
  const { data: stressRecords = [], isPending: stressLoading } = useQuery(
    convexQuery(api.stressRecords.list, {})
  )

  // Fetch dizziness records (uses recordedAt timestamp)
  const { data: dizzinessRecords = [], isPending: dizzinessLoading } = useQuery(
    convexQuery(api.dizzinessRecords.list, {})
  )

  // Get today's records
  const todaySleep = useMemo(() => {
    const record = sleepRecords.find((r) => r.date === today)
    return record ? { hours: record.hours, quality: record.quality } : null
  }, [sleepRecords, today])

  const todayStress = useMemo(() => {
    const record = stressRecords.find(
      (r) => r.recordedAt >= todayStart && r.recordedAt <= todayEnd
    )
    return record ? { level: record.level, notes: record.notes } : null
  }, [stressRecords, todayStart, todayEnd])

  const todayDizziness = useMemo(() => {
    const record = dizzinessRecords.find(
      (r) => r.recordedAt >= todayStart && r.recordedAt <= todayEnd
    )
    if (!record) return null
    return {
      experienced: record.severity > 0,
      severity: record.severity,
      notes: record.notes,
    }
  }, [dizzinessRecords, todayStart, todayEnd])

  // Mutations - using upsert for one-record-per-day behavior
  const sleepMutation = useMutation({
    mutationFn: useConvexMutation(api.sleepRecords.upsert),
    onSuccess: (result: { updated: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["sleepRecords"] })
      toast.success(result.updated ? t("sleepUpdated") : t("sleepRecorded"))
    },
    onError: () => toast.error(t("sleepError")),
  })

  const stressMutation = useMutation({
    mutationFn: useConvexMutation(api.stressRecords.upsert),
    onSuccess: (result: { updated: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["stressRecords"] })
      toast.success(result.updated ? t("stressUpdated") : t("stressRecorded"))
    },
    onError: () => toast.error(t("stressError")),
  })

  const dizzinessMutation = useMutation({
    mutationFn: useConvexMutation(api.dizzinessRecords.upsert),
    onSuccess: (result: { updated: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["dizzinessRecords"] })
      toast.success(result.updated ? t("dizzinessUpdated") : t("dizzinessRecorded"))
    },
    onError: () => toast.error(t("dizzinessError")),
  })

  // History data (simple transformation)
  const sleepHistory = useMemo(
    () => sleepRecords.map((r) => ({ hours: r.hours, quality: r.quality })),
    [sleepRecords]
  )

  const stressHistory = useMemo(
    () => stressRecords.map((r) => ({ level: r.level, notes: r.notes })),
    [stressRecords]
  )

  const dizzinessHistory = useMemo(
    () =>
      dizzinessRecords.map((r) => ({
        experienced: r.severity > 0,
        severity: r.severity,
        notes: r.notes,
      })),
    [dizzinessRecords]
  )

  return {
    todaySleep,
    todayStress,
    todayDizziness,
    saveSleep: (data) => {
      sleepMutation.mutate({
        date: today,
        hours: data.hours,
        quality: data.quality,
      })
    },
    saveStress: (data) => {
      stressMutation.mutate({
        level: data.level,
        notes: data.notes,
        date: today,
      })
    },
    saveDizziness: (data) => {
      dizzinessMutation.mutate({
        severity: data.experienced ? (data.severity ?? 5) : 0,
        symptoms: [],
        notes: data.notes,
        date: today,
      })
    },
    isLoading: sleepLoading || stressLoading || dizzinessLoading,
    sleepHistory,
    stressHistory,
    dizzinessHistory,
  }
}

