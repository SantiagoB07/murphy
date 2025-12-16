import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";

import {
  useQuery,
  useMutation
} from "convex/react";
import { api } from "@murphy/backend/convex/_generated/api";
import { useAction } from "convex/react";


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

export function useOnboardingForm() {
  const [isPending, setIsPending] = useState(false);
  const onboard = useAction(api.users.onboardUser);

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
      setIsPending(true);
      
      // Map form values to backend API format
      await onboard({
        fullName: value.name,
        phoneNumber: value.phone,
        age: parseInt(value.age) || 0,
        gender: value.sex as 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir',
        diabetesType: value.diabetesType as 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY',
        diagnosisYear: value.diagnosisYear ? parseInt(value.diagnosisYear) : undefined,
        city: value.residence || undefined,
        estrato: value.socioeconomicLevel ? parseInt(value.socioeconomicLevel) : undefined,
      });

      setIsPending(false);
      window.location.replace('/dashboard');
    },
  });

  return { form, isPending };
}
