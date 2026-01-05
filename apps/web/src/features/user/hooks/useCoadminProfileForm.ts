"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import type { CoadminProfileFormData } from "../user.types"

export function useCoadminProfileForm(initialData: CoadminProfileFormData) {
  const updateProfileMutation = useConvexMutation(api.coadmins.updateCoadminProfile)

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: CoadminProfileFormData) => {
      return await updateProfileMutation({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
      })
    },
    onSuccess: () => {
      toast.success("Perfil actualizado correctamente")
    },
    onError: (error) => {
      console.error("Error updating profile:", error)
      toast.error("Error al actualizar el perfil")
    },
  })

  const form = useForm({
    defaultValues: initialData,
    onSubmit: async ({ value }) => {
      updateProfile(value)
    },
  })

  return {
    form,
    isPending,
  }
}
