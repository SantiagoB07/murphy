import { z } from "zod";

export type UserRole = "patient" | "coadmin";

export type DiabetesType = "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY";
export type GenderType = "masculino" | "femenino" | "otro" | "prefiero_no_decir";

export const DIABETES_TYPES: DiabetesType[] = ["Tipo 1", "Tipo 2", "Gestacional", "LADA", "MODY"];
export const GENDER_TYPES: GenderType[] = ["masculino", "femenino", "otro", "prefiero_no_decir"];

export const patientDataSchema = z.object({
  fullName: z.string().min(1, "Nombre es requerido"),
  phoneNumber: z.string().optional(),
  diabetesType: z.enum(DIABETES_TYPES, { message: "Tipo de diabetes es requerido" }),
  diagnosisYear: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.enum(GENDER_TYPES).optional(),
  city: z.string().optional(),
  estrato: z.string().optional(),
});

export const coadminProfileSchema = z.object({
  fullName: z.string().min(1, "Nombre es requerido"),
  phoneNumber: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientDataSchema>;
export type CoadminProfileFormData = z.infer<typeof coadminProfileSchema>;

export interface UserData {
  role: UserRole;
  isLoading: boolean;
}
