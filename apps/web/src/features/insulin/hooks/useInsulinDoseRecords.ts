"use client"

import { useMemo } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { Id } from "@murphy/backend/convex/_generated/dataModel"
import type { InsulinType, InsulinFormData } from "../insulin.types"

export interface InsulinDoseRecord {
  _id: string
  patientId: string
  dose: number
  insulinType: InsulinType
  scheduledTime?: string
  administeredAt: number
  notes?: string
}

interface UseInsulinDoseRecordsReturn {
  /** Today's dose records */
  todayRecords: InsulinDoseRecord[]
  /** Whether data is loading */
  isLoading: boolean
  /** Whether there was an error */
  isError: boolean
  /** Create a new dose record */
  createDoseRecord: (
    data: InsulinFormData & { administeredAt: number },
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => void
  /** Whether a create is in progress */
  isCreating: boolean
  /** Delete a dose record */
  deleteDoseRecord: (
    id: string,
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => void
  /** Whether a delete is in progress */
  isDeleting: boolean
}

// Get start and end of today in timestamps
function getTodayRange(): { start: number; end: number } {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )
  return {
    start: startOfDay.getTime(),
    end: endOfDay.getTime(),
  }
}

export function useInsulinDoseRecords(): UseInsulinDoseRecordsReturn {
  // Memoize today's range to keep query args stable
  const { start, end } = useMemo(() => getTodayRange(), [])

  // Fetch today's dose records - reactive subscription
  const {
    data: records,
    isPending,
    isError,
  } = useQuery(
    convexQuery(api.insulinDoseRecords.list, {
      startTimestamp: start,
      endTimestamp: end,
    })
  )

  // Mutation to create a new dose record
  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.insulinDoseRecords.create),
  })

  // Mutation to delete a dose record
  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.insulinDoseRecords.remove),
  })

  const createDoseRecord = (
    data: InsulinFormData & { administeredAt: number },
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

  const deleteDoseRecord = (
    id: string,
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
    }
  ) => {
    deleteMutation.mutate(
      // @ts-expect-error - Convex ID type mismatch with string
      { id },
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
    deleteDoseRecord,
    isDeleting: deleteMutation.isPending,
  }
}

