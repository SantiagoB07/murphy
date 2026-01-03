"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@murphy/backend/convex/_generated/api"
import { toast } from "sonner"

export interface DemoFormValues {
  nombre: string
  tipoUsuario: "paciente" | "coadministrador" | "medico"
  celular: string
  email: string
  fechaContacto?: string
  horaContacto?: string
}

export function useDemoForm(translations: {
  validation: {
    nombreRequired: string
    tipoUsuarioRequired: string
    celularRequired: string
    emailRequired: string
    emailInvalid: string
  }
  success: {
    title: string
  }
  error: string
}) {
  const [isPending, setIsPending] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const createLead = useMutation(api.demoLeads.create)

  const form = useForm({
    defaultValues: {
      nombre: "",
      tipoUsuario: "" as "" | "paciente" | "coadministrador" | "medico",
      celular: "",
      email: "",
      fechaContacto: "",
      horaContacto: "",
    },
    onSubmit: async ({ value }) => {
      try {
        setIsPending(true)

        await createLead({
          nombre: value.nombre,
          tipoUsuario: value.tipoUsuario as "paciente" | "coadministrador" | "medico",
          celular: value.celular,
          email: value.email,
          fechaContacto: value.fechaContacto || undefined,
          horaContacto: value.horaContacto || undefined,
        })

        setIsSuccess(true)
        toast.success(translations.success.title)
      } catch (error) {
        console.error("Submission error:", error)
        toast.error(translations.error)
      } finally {
        setIsPending(false)
      }
    },
  })

  return { form, isPending, isSuccess, translations }
}
