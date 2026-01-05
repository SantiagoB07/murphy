"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import { createCoadminProfileSchema, type CoadminProfileFormData } from "../user.types"

export function useCoadminProfileForm(initialData: CoadminProfileFormData) {
  const t = useTranslations("Configuracion.coadminProfileForm")
  const tToast = useTranslations("Configuracion.coadminProfileForm.toast")
  const updateProfileMutation = useConvexMutation(api.coadmins.updateCoadminProfile)

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: CoadminProfileFormData) => {
      return await updateProfileMutation({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
      })
    },
    onSuccess: () => {
      toast.success(tToast("successMessage"))
    },
    onError: (error) => {
      console.error("Error updating profile:", error)
      toast.error(tToast("errorMessage"))
    },
  })

  const formSchema = createCoadminProfileSchema(t)

  const form = useForm({
    defaultValues: initialData,
    validators: {
      onBlur: formSchema,
    },
    onSubmit: async ({ value }) => {
      updateProfile(value)
    },
  })

  return {
    form,
    isPending,
  }
}
