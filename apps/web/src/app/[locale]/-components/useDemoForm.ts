"use client"

import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { z } from "zod"
import { useMutation } from "convex/react"
import { api } from "@murphy/backend/convex/_generated/api"
import { toast } from "sonner"

export const demoFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  tipoUsuario: z.enum(["paciente", "coadministrador", "medico"]),
  celular: z.string().min(1, "El número de celular es requerido"),
  email: z.string().email("Ingresa un correo electrónico válido"),
  fechaContacto: z.string().optional(),
  horaContacto: z.string().optional(),
})

export type DemoFormValues = z.infer<typeof demoFormSchema>

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
