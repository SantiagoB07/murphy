"use client"

import { useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"

export interface CreateInsulinDoseData {
  dose: number
  insulinType: "rapid" | "basal"
  scheduledTime?: string
  administeredAt?: number
  notes?: string
}

export interface InsulinDoseRecord {
  _id: string
  patientId: string
  dose: number
  insulinType: "rapid" | "basal"
  scheduledTime?: string
  administeredAt: number
  notes?: string
}

interface UseInsulinDoseRecordsReturn {
  todayRecords: InsulinDoseRecord[]
  isLoading: boolean
  isError: boolean
  createDoseRecord: (
    data: CreateInsulinDoseData,
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => void
  isCreating: boolean
}

// Get start and end of today in timestamps
function getTodayRange(): { start: number; end: number } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  return {
    start: startOfDay.getTime(),
    end: endOfDay.getTime(),
  }
}

export function useInsulinDoseRecords(): UseInsulinDoseRecordsReturn {
  // Memoize today's range to keep query args stable
  const { start, end } = useMemo(() => getTodayRange(), [])

  // Fetch today's dose records - reactive subscription
  const { data: records, isPending, isError } = useQuery(
    convexQuery(api.insulinDoseRecords.list, {
      startTimestamp: start,
      endTimestamp: end,
    })
  )

  // Mutation to create a new dose record
  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.insulinDoseRecords.create),
  })

  const createDoseRecord = (
    data: CreateInsulinDoseData,
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => {
    createMutation.mutate(
      {
        dose: data.dose,
        insulinType: data.insulinType,
        scheduledTime: data.scheduledTime,
        administeredAt: data.administeredAt,
        notes: data.notes,
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
    todayRecords: (records as InsulinDoseRecord[]) ?? [],
    isLoading: isPending,
    isError,
    createDoseRecord,
    isCreating: createMutation.isPending,
  }
}
