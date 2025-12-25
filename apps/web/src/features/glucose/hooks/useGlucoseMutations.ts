"use client"

import { useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { Id } from "@murphy/backend/convex/_generated/dataModel"
import { toast } from "sonner"
import { format } from "date-fns"
import type { GlucoseSlot } from "../glucose.types"

interface UseGlucoseMutationsReturn {
  /** Create a new glucose record */
  createRecord: (value: number, slot?: GlucoseSlot, notes?: string) => void
  /** Update an existing glucose record */
  updateRecord: (
    id: Id<"glucoseRecords">,
    value: number,
    slot?: GlucoseSlot,
    notes?: string
  ) => void
  /** Delete a glucose record */
  deleteRecord: (id: Id<"glucoseRecords">) => void
  /** Whether a create operation is in progress */
  isCreating: boolean
  /** Whether an update operation is in progress */
  isUpdating: boolean
  /** Whether a delete operation is in progress */
  isDeleting: boolean
  /** Whether any mutation is in progress */
  isPending: boolean
}

export function useGlucoseMutations(): UseGlucoseMutationsReturn {
  const queryClient = useQueryClient()

  // Create mutation
  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucoseRecords"] })
      toast.success("Glucosa registrada")
    },
    onError: () => toast.error("Error al guardar glucosa"),
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucoseRecords"] })
      toast.success("Glucosa actualizada")
    },
    onError: () => toast.error("Error al actualizar glucosa"),
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.remove),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["glucoseRecords"] })
      toast.success("Registro eliminado")
    },
    onError: () => toast.error("Error al eliminar registro"),
  })

  // Create a new record
  const createRecord = useCallback(
    (value: number, slot?: GlucoseSlot, notes?: string) => {
      const now = new Date()
      const date = format(now, "yyyy-MM-dd")

      createMutation.mutate({
        value,
        date,
        recordedAt: now.getTime(),
        slot,
        notes,
      })
    },
    [createMutation]
  )

  // Update an existing record
  const updateRecord = useCallback(
    (
      id: Id<"glucoseRecords">,
      value: number,
      slot?: GlucoseSlot,
      notes?: string
    ) => {
      updateMutation.mutate({
        id,
        value,
        slot,
        notes,
      })
    },
    [updateMutation]
  )

  // Delete a record
  const deleteRecord = useCallback(
    (id: Id<"glucoseRecords">) => {
      deleteMutation.mutate({ id })
    },
    [deleteMutation]
  )

  return {
    createRecord,
    updateRecord,
    deleteRecord,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isPending:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  }
}

