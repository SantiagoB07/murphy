"use client"

import { useState, useCallback } from "react"
import type { InsulinSchedule } from "@/types/diabetes"

export interface UpdateInsulinData {
  unitsPerDose: number
  timesPerDay: number
  brand?: string
  effectiveFrom: Date
  changeReason?: string
  orderedBy?: string
  notes?: string
}

// Helper function to calculate percentage change
export function calculateChange(
  prevValue: number | undefined,
  currentValue: number
): string {
  if (!prevValue) return `Inicio: ${currentValue}U`

  const diff = currentValue - prevValue
  const percent = Math.round((diff / prevValue) * 100)
  const arrow = diff > 0 ? "+" : diff < 0 ? "" : ""

  return `${prevValue}U -> ${currentValue}U (${arrow}${percent}%)`
}

// Mock data for insulin schedules
const mockRapidSchedule: InsulinSchedule = {
  id: "rapid-1",
  patientId: "patient-1",
  type: "rapid",
  timesPerDay: 3,
  unitsPerDose: 8,
  brand: "Humalog (Lispro)",
  effectiveFrom: "2024-10-15",
  isActive: true,
  createdAt: "2024-10-15T10:00:00Z",
  updatedAt: "2024-10-15T10:00:00Z",
}

const mockBasalSchedule: InsulinSchedule = {
  id: "basal-1",
  patientId: "patient-1",
  type: "basal",
  timesPerDay: 1,
  unitsPerDose: 20,
  brand: "Lantus (Glargina U100)",
  effectiveFrom: "2024-09-01",
  isActive: true,
  createdAt: "2024-09-01T10:00:00Z",
  updatedAt: "2024-09-01T10:00:00Z",
}

const mockHistory: InsulinSchedule[] = [
  mockRapidSchedule,
  mockBasalSchedule,
  {
    id: "rapid-0",
    patientId: "patient-1",
    type: "rapid",
    timesPerDay: 3,
    unitsPerDose: 6,
    brand: "Humalog (Lispro)",
    effectiveFrom: "2024-08-01",
    effectiveUntil: "2024-10-14",
    changeReason: "Ajuste inicial",
    changedByRole: "patient",
    isActive: false,
    createdAt: "2024-08-01T10:00:00Z",
    updatedAt: "2024-10-15T10:00:00Z",
  },
  {
    id: "basal-0",
    patientId: "patient-1",
    type: "basal",
    timesPerDay: 1,
    unitsPerDose: 18,
    brand: "Lantus (Glargina U100)",
    effectiveFrom: "2024-07-01",
    effectiveUntil: "2024-08-31",
    changeReason: "Inicio de tratamiento",
    orderedBy: "Dr. Garcia",
    changedByRole: "patient",
    isActive: false,
    createdAt: "2024-07-01T10:00:00Z",
    updatedAt: "2024-09-01T10:00:00Z",
  },
]

interface UseInsulinScheduleReturn {
  rapidSchedule: InsulinSchedule | null
  basalSchedule: InsulinSchedule | null
  history: InsulinSchedule[]
  isLoading: boolean
  isError: boolean
  updateSchedule: (
    params: { insulinType: "rapid" | "basal"; data: UpdateInsulinData },
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => void
  isUpdating: boolean
}

export function useInsulinSchedule(
  _patientId?: string | null
): UseInsulinScheduleReturn {
  const [rapidSchedule, setRapidSchedule] = useState<InsulinSchedule | null>(
    mockRapidSchedule
  )
  const [basalSchedule, setBasalSchedule] = useState<InsulinSchedule | null>(
    mockBasalSchedule
  )
  const [history, setHistory] = useState<InsulinSchedule[]>(mockHistory)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateSchedule = useCallback(
    (
      params: { insulinType: "rapid" | "basal"; data: UpdateInsulinData },
      options?: {
        onSuccess?: () => void
        onError?: (error: Error) => void
      }
    ) => {
      setIsUpdating(true)

      // Simulate API call
      setTimeout(() => {
        const { insulinType, data } = params
        const newSchedule: InsulinSchedule = {
          id: `${insulinType}-${Date.now()}`,
          patientId: "patient-1",
          type: insulinType,
          timesPerDay: data.timesPerDay,
          unitsPerDose: data.unitsPerDose,
          brand: data.brand,
          effectiveFrom: data.effectiveFrom.toISOString().split("T")[0],
          changeReason: data.changeReason,
          orderedBy: data.orderedBy,
          notes: data.notes,
          changedByRole: "patient",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        if (insulinType === "rapid") {
          // Deactivate old schedule
          if (rapidSchedule) {
            setHistory((prev) => [
              newSchedule,
              { ...rapidSchedule, isActive: false },
              ...prev.filter((h) => h.id !== rapidSchedule.id),
            ])
          }
          setRapidSchedule(newSchedule)
        } else {
          if (basalSchedule) {
            setHistory((prev) => [
              newSchedule,
              { ...basalSchedule, isActive: false },
              ...prev.filter((h) => h.id !== basalSchedule.id),
            ])
          }
          setBasalSchedule(newSchedule)
        }

        setIsUpdating(false)
        console.log("[Mock] updateSchedule called", params)
        options?.onSuccess?.()
      }, 500)
    },
    [rapidSchedule, basalSchedule]
  )

  return {
    rapidSchedule,
    basalSchedule,
    history,
    isLoading: false,
    isError: false,
    updateSchedule,
    isUpdating,
  }
}
