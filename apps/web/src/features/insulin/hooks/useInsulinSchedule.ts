"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { InsulinType, InsulinScheduleData } from "../insulin.types"

export interface UpdateInsulinData {
  unitsPerDose: number
  timesPerDay: number
}

interface InsulinScheduleRecord {
  id: string
  patientId: string
  type: InsulinType
  timesPerDay: number
  unitsPerDose: number
  brand?: string
  effectiveFrom: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface UseInsulinScheduleReturn {
  /** Active rapid insulin schedule */
  rapidSchedule: InsulinScheduleRecord | null
  /** Active basal insulin schedule */
  basalSchedule: InsulinScheduleRecord | null
  /** Schedule history */
  history: InsulinScheduleRecord[]
  /** Whether data is loading */
  isLoading: boolean
  /** Whether there was an error */
  isError: boolean
  /** Update a schedule */
  updateSchedule: (
    params: { insulinType: InsulinType; data: UpdateInsulinData },
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => void
  /** Whether an update is in progress */
  isUpdating: boolean
}

// Helper: Convert Convex schedule to typed record
function convexToInsulinSchedule(record: any): InsulinScheduleRecord {
  const updatedAtTimestamp = record.updatedAt ?? record._creationTime
  const createdAtTimestamp = record._creationTime

  return {
    id: record._id,
    patientId: record.patientId,
    type: record.insulinType,
    timesPerDay: record.timesPerDay,
    unitsPerDose: record.unitsPerDose,
    brand: record.notes,
    effectiveFrom: new Date(updatedAtTimestamp).toISOString().split("T")[0],
    notes: record.notes,
    isActive: true,
    createdAt: new Date(createdAtTimestamp).toISOString(),
    updatedAt: new Date(updatedAtTimestamp).toISOString(),
  }
}

export function useInsulinSchedule(): UseInsulinScheduleReturn {
  // Fetch active rapid insulin schedule
  const { data: rapidData, isPending: rapidLoading } = useQuery(
    convexQuery(api.insulinSchedules.getByType, { insulinType: "rapid" })
  )

  // Fetch active basal insulin schedule
  const { data: basalData, isPending: basalLoading } = useQuery(
    convexQuery(api.insulinSchedules.getByType, { insulinType: "basal" })
  )

  // Convert to typed records
  const rapidSchedule = rapidData?.[0]
    ? convexToInsulinSchedule(rapidData[0])
    : null
  const basalSchedule = basalData?.[0]
    ? convexToInsulinSchedule(basalData[0])
    : null

  // Build history from current schedules
  const history: InsulinScheduleRecord[] = []
  if (rapidSchedule) history.push(rapidSchedule)
  if (basalSchedule) history.push(basalSchedule)

  // Mutation to create or update a schedule
  const upsertMutation = useMutation({
    mutationFn: useConvexMutation(api.insulinSchedules.upsert),
  })

  const updateSchedule = (
    params: { insulinType: InsulinType; data: UpdateInsulinData },
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

