"use client"

import { useForm } from "@tanstack/react-form"
import { useQuery, useMutation } from "@tanstack/react-query"
import { convexQuery, useConvexMutation } from "@convex-dev/react-query"
import { toast } from "sonner"
import { api } from "@murphy/backend/convex/_generated/api"
import type { PatientFormData } from "../user.types"

export function usePatientDataForm() {
  const { data: profile, isPending: isLoadingProfile } = useQuery(
    convexQuery(api.patients.getCurrentProfile, {})
  )

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
      toast.success("Datos actualizados correctamente")
    },
    onError: (error) => {
      console.error("Error updating profile:", error)
      toast.error("Error al actualizar los datos")
    },
  })

  const form = useForm({
    defaultValues: {
      fullName: profile?.fullName ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
      diabetesType: profile?.diabetesType ?? ("Tipo 1" as const),
      diagnosisYear: profile?.diagnosisYear?.toString() ?? "",
      birthDate: profile?.birthDate ?? "",
      gender: profile?.gender,
      city: profile?.city ?? "",
      estrato: profile?.estrato?.toString() ?? "",
    } as PatientFormData,
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
