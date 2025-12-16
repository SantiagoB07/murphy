"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useUser } from "@clerk/nextjs";
import { useAction } from "convex/react";
import { toast } from "sonner";

import { api } from "@murphy/backend/convex/_generated/api";

export const patientFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos").max(10, "El teléfono debe tener máximo 10 dígitos"),
  age: z.string(),
  sex: z.enum(['masculino', 'femenino', 'otro', 'prefiero_no_decir', '']),
  diabetesType: z.enum(['Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY', '']),
  diagnosisYear: z.string(),
  residence: z.string(),
  socioeconomicLevel: z.string(),
});

type FormValues = {
  name: string
  phone: string
  age: string
  sex: '' | 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir'
  diabetesType: '' | 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY'
  diagnosisYear: string
  residence: string
  socioeconomicLevel: string
}

export function useOnboardingForm() {
  const { user } = useUser();
  const onboardAction = useAction(api.users.onboardUser);

  const { mutate: onboardUser, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      // Map form values to backend API format
      return await onboardAction({
        fullName: values.name,
        phoneNumber: values.phone,
        age: parseInt(values.age) || 0,
        gender: values.sex as 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir',
        diabetesType: values.diabetesType as 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY',
        diagnosisYear: values.diagnosisYear ? parseInt(values.diagnosisYear) : undefined,
        city: values.residence || undefined,
        estrato: values.socioeconomicLevel ? parseInt(values.socioeconomicLevel) : undefined,
      });
    },
    throwOnError: false,
    onError: (error) => {
      console.error('Error during onboarding:', error);
      toast.error("Error al completar el registro. Por favor intenta de nuevo.");
    },
    onSuccess: async () => {
      // Reload user to ensure publicMetadata is fresh before redirecting
      await user?.reload();
      toast.success("Perfil completado exitosamente");
      
      // Full page redirect to dashboard
      window.location.replace('/dashboard');
    },
  });

  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      age: '',
      sex: '' as '' | 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir',
      diabetesType: '' as '' | 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY',
      diagnosisYear: '',
      residence: '',
      socioeconomicLevel: '',
    },
    onSubmit: async ({ value }) => {
      onboardUser(value);
    },
  });

  return { form, isPending };
}
