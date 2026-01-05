import { z } from "zod"

export type UserRole = "patient" | "coadmin"

export type DiabetesType = "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY"
export type GenderType = "masculino" | "femenino" | "otro" | "prefiero_no_decir"

export const DIABETES_TYPES: DiabetesType[] = ["Tipo 1", "Tipo 2", "Gestacional", "LADA", "MODY"]
export const GENDER_TYPES: GenderType[] = ["masculino", "femenino", "otro", "prefiero_no_decir"]

// Factory function to create schemas with i18n error messages
export const createCoadminProfileSchema = (t: (key: string) => string) =>
  z.object({
    fullName: z.string().min(1, t("fields.fullName.required")),
    phoneNumber: z.string().optional(),
  })

export const createPatientDataSchema = (t: (key: string) => string) =>
  z.object({
    fullName: z.string().min(1, t("fields.fullName.required")),
    phoneNumber: z.string().optional(),
    diabetesType: z.enum(DIABETES_TYPES, { message: t("fields.diabetesType.required") }),
    diagnosisYear: z
      .string()
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return
        const year = parseInt(val)
        if (isNaN(year)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("fields.diagnosisYear.validation.mustBeNumber"),
          })
          return
        }
        if (year < 1950) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("fields.diagnosisYear.validation.after1950"),
          })
          return
        }
        if (year > new Date().getFullYear()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("fields.diagnosisYear.validation.cannotBeFuture"),
          })
        }
      }),
    birthDate: z.string().optional(),
    gender: z.enum(GENDER_TYPES).optional(),
    city: z.string().optional(),
    estrato: z.string().optional(),
  })

export type PatientFormData = z.infer<ReturnType<typeof createPatientDataSchema>>
export type CoadminProfileFormData = z.infer<ReturnType<typeof createCoadminProfileSchema>>

export interface UserData {
  role: UserRole
  isLoading: boolean
}
