"use client"

import { useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { AlertSchedule, AlertChannel, AlertScheduleType, ScheduleFrequency } from "@/types/diabetes"
import { toast } from "sonner"

interface AlertSchedulesReturn {
  schedules: AlertSchedule[]
  addSchedule: (
    time: string,
    channel: AlertChannel,
    type: AlertScheduleType,
    frequency: ScheduleFrequency
  ) => Promise<void>
  deleteSchedule: (id: string) => void
  toggleSchedule: (id: string, isActive: boolean) => void
  isLoading: boolean
  isPending: boolean
}

// Helper: Convert Convex record to AlertSchedule
function convexToAlertSchedule(record: {
  _id: string
  time: string
  channel: "call" | "whatsapp"
  type: "glucometry" | "insulin" | "wellness" | "general"
  frequency: "daily" | "once"
  isActive: boolean
}): AlertSchedule {
  return {
    id: record._id,
    time: record.time,
    channel: record.channel,
    type: record.type,
    frequency: record.frequency,
  }
}

export function useAlertSchedules(): AlertSchedulesReturn {
  const queryClient = useQueryClient()

  // Fetch all alert schedules from Convex
  const { data: convexSchedules = [], isPending } = useQuery(
    convexQuery(api.aiCallSchedules.list, { activeOnly: true })
  )

  // Convert Convex records to AlertSchedule format
  const schedules = convexSchedules.map(convexToAlertSchedule)

  // Mutation to create a schedule
  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.aiCallSchedules.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiCallSchedules"] })
      toast.success("Alerta creada exitosamente")
    },
    onError: () => toast.error("Error al crear alerta"),
  })

  // Mutation to delete a schedule
  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.aiCallSchedules.remove),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiCallSchedules"] })
      toast.success("Alerta eliminada")
    },
    onError: () => toast.error("Error al eliminar alerta"),
  })

  // Mutation to toggle schedule active status
  const toggleMutation = useMutation({
    mutationFn: useConvexMutation(api.aiCallSchedules.toggle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiCallSchedules"] })
    },
    onError: () => toast.error("Error al actualizar alerta"),
  })

  // Add a new schedule
  const addSchedule = useCallback(
    async (
      time: string,
      channel: AlertChannel,
      type: AlertScheduleType,
      frequency: ScheduleFrequency
    ) => {
      await createMutation.mutateAsync({
        time,
        channel,
        type,
        frequency,
      })
    },
    [createMutation]
  )

  // Delete a schedule
  const deleteSchedule = useCallback(
    (id: string) => {
      deleteMutation.mutate({
        id: id as any, // Type assertion needed for Convex ID
      })
    },
    [deleteMutation]
  )

  // Toggle schedule active status
  const toggleSchedule = useCallback(
    (id: string, isActive: boolean) => {
      toggleMutation.mutate({
        id: id as any, // Type assertion needed for Convex ID
        isActive,
      })
    },
    [toggleMutation]
  )

  return {
    schedules,
    addSchedule,
    deleteSchedule,
    toggleSchedule,
    isLoading: isPending,
    isPending:
      createMutation.isPending ||
      deleteMutation.isPending ||
      toggleMutation.isPending,
  }
}

