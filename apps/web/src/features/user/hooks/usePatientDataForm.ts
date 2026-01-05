"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import { createPatientDataSchema, type PatientFormData } from "../user.types"

export function usePatientDataForm(initialData: PatientFormData) {
  const t = useTranslations("Configuracion.patientDataForm")
  const tToast = useTranslations("Configuracion.patientDataForm.toast")
  const updateProfileMutation = useConvexMutation(api.patients.updateProfile)

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: async (data: PatientFormData) => {
      return await updateProfileMutation({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
        diabetesType: data.diabetesType,
        diagnosisYear: data.diagnosisYear ? parseInt(data.diagnosisYear) : undefined,
        birthDate: data.birthDate || undefined,
        gender: data.gender,
        city: data.city || undefined,
        estrato: data.estrato ? parseInt(data.estrato) : undefined,
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

  const formSchema = createPatientDataSchema(t)

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
