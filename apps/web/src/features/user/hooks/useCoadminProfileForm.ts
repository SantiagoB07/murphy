"use client"

import { useForm } from "@tanstack/react-form"
import { useQuery, useMutation } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import type { CoadminProfileFormData } from "../user.types"

export function useCoadminProfileForm() {
  const { data: profile, isPending: isLoadingProfile } = useQuery(
    convexQuery(api.coadmins.getCoadminOwnProfile, {})
  )

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
    defaultValues: {
      fullName: profile?.fullName ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
    } as CoadminProfileFormData,
    onSubmit: async ({ value }) => {
      updateProfile(value)
    },
  })

  return {
    form,
    isPending,
    isLoading: isLoadingProfile,
  }
}
