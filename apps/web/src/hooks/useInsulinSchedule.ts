"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
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

// Helper: Convert Convex schedule to InsulinSchedule type
function convexToInsulinSchedule(record: any): InsulinSchedule {
  // Use updatedAt if available, otherwise fall back to _creationTime
  const updatedAtTimestamp = record.updatedAt ?? record._creationTime
  const createdAtTimestamp = record._creationTime

  return {
    id: record._id,
    patientId: record.patientId,
    type: record.insulinType,
    timesPerDay: record.timesPerDay,
    unitsPerDose: record.unitsPerDose,
    brand: record.notes, // Using notes field for brand temporarily
    effectiveFrom: new Date(updatedAtTimestamp).toISOString().split("T")[0],
    notes: record.notes,
    isActive: true,
    createdAt: new Date(createdAtTimestamp).toISOString(),
    updatedAt: new Date(updatedAtTimestamp).toISOString(),
  }
}

export function useInsulinSchedule(
  _patientId?: string | null
): UseInsulinScheduleReturn {
  // Fetch active rapid insulin schedule
  const { data: rapidData, isPending: rapidLoading } = useQuery(
    convexQuery(api.insulinSchedules.getByType, { insulinType: "rapid" })
  )

  // Fetch active basal insulin schedule
  const { data: basalData, isPending: basalLoading } = useQuery(
    convexQuery(api.insulinSchedules.getByType, { insulinType: "basal" })
  )

  // Convert to InsulinSchedule type (getByType returns an array, take the first/latest)
  const rapidSchedule = rapidData?.[0] ? convexToInsulinSchedule(rapidData[0]) : null
  const basalSchedule = basalData?.[0] ? convexToInsulinSchedule(basalData[0]) : null

  // Build history from current schedules (in future, add a query for historical schedules)
  const history: InsulinSchedule[] = []
  if (rapidSchedule) history.push(rapidSchedule)
  if (basalSchedule) history.push(basalSchedule)

  // Mutation to create or update a schedule
  const upsertMutation = useMutation({
    mutationFn: useConvexMutation(api.insulinSchedules.upsert),
  })

  const updateSchedule = (
    params: { insulinType: "rapid" | "basal"; data: UpdateInsulinData },
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => {
    const { insulinType, data } = params

    upsertMutation.mutate(
      {
        insulinType,
        unitsPerDose: data.unitsPerDose,
        timesPerDay: data.timesPerDay,
        notes: data.notes || data.brand,
      },
      {
        onSuccess: () => {
          options?.onSuccess?.()
        },
        onError: (error: any) => {
          options?.onError?.(error)
        },
      }
    )
  }

  return {
    rapidSchedule,
    basalSchedule,
    history,
    isLoading: rapidLoading || basalLoading,
    isError: false,
    updateSchedule,
    isUpdating: upsertMutation.isPending,
  }
}
