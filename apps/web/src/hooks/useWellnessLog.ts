"use client"

import { useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { toast } from "sonner"

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
  severity?: number // 1-10, only if experienced is true
  notes?: string
}

interface WellnessLogReturn {
  todaySleep: SleepData | null
  todayStress: StressData | null
  todayDizziness: DizzinessData | null
  saveSleep: (data: { hours: number; quality: number }) => void
  saveStress: (data: { level: number; notes?: string }) => void
  saveDizziness: (data: {
    experienced: boolean
    severity?: number
    notes?: string
  }) => void
  isLoading: boolean
  sleepHistory: SleepData[]
  stressHistory: StressData[]
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

export function useWellnessLog(_patientId?: string): WellnessLogReturn {
  const queryClient = useQueryClient()
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

  // Fetch dizziness records (uses recordedAt timestamp + severity instead of experienced boolean)
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
      toast.success(result.updated ? "Sueno actualizado" : "Sueno registrado")
    },
    onError: () => toast.error("Error al guardar sueno"),
  })

  const stressMutation = useMutation({
    mutationFn: useConvexMutation(api.stressRecords.upsert),
    onSuccess: (result: { updated: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["stressRecords"] })
      toast.success(result.updated ? "Estres actualizado" : "Estres registrado")
    },
    onError: () => toast.error("Error al guardar estres"),
  })

  const dizzinessMutation = useMutation({
    mutationFn: useConvexMutation(api.dizzinessRecords.upsert),
    onSuccess: (result: { updated: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["dizzinessRecords"] })
      toast.success(result.updated ? "Mareo actualizado" : "Mareo registrado")
    },
    onError: () => toast.error("Error al guardar mareo"),
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
        symptoms: [], // Empty for now, could be extended later
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
