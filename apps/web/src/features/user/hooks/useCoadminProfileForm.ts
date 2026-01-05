"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import type { CoadminProfileFormData } from "../user.types"

export function useCoadminProfileForm(initialData: CoadminProfileFormData) {
  const t = useTranslations("Configuracion.coadminProfileForm.toast")
  const updateProfileMutation = useConvexMutation(api.coadmins.updateCoadminProfile)

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: CoadminProfileFormData) => {
      return await updateProfileMutation({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
      })
    },
    onSuccess: () => {
      toast.success(t("successMessage"))
    },
    onError: (error) => {
      console.error("Error updating profile:", error)
      toast.error(t("errorMessage"))
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
