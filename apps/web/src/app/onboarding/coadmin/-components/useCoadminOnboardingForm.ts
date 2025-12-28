"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { useUser } from "@clerk/nextjs"
import { useAction } from "convex/react"
import { toast } from "sonner"

import { api } from "@murphy/backend/convex/_generated/api"

export const coadminFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").max(10, "El teléfono debe tener máximo 10 dígitos"),
})

type FormValues = {
  name: string
  phone: string
}

export function useCoadminOnboardingForm() {
  const { user } = useUser()
  const onboardAction = useAction(api.coadmins.onboardCoadmin)

  const { mutate: onboardCoadmin, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      return await onboardAction({
        fullName: values.name,
        phoneNumber: `+57${values.phone}`,
      })
    },
    throwOnError: false,
    onError: (error) => {
      console.error("Error during coadmin onboarding:", error)
      toast.error("Error al completar el registro. Por favor intenta de nuevo.")
    },
    onSuccess: async () => {
      // Reload user to ensure publicMetadata is fresh before redirecting
      await user?.reload()
      toast.success("Registro completado exitosamente")
      
      // Full page redirect to dashboard
      window.location.replace("/dashboard")
    },
  })

  const form = useForm({
    defaultValues: {
      name: "",
      phone: "",
    },
    onSubmit: async ({ value }) => {
      onboardCoadmin(value)
    },
  })

  return { form, isPending }
}




