"use client"

import { useTranslations } from "next-intl"
import { User, Calendar, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { usePatientDataForm } from "../hooks/usePatientDataForm"
import type { PatientFormData } from "../user.types"

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return String(error)
}

interface PatientDataFormProps {
  initialData: PatientFormData
}

export function PatientDataForm({ initialData }: PatientDataFormProps) {
  const t = useTranslations("Configuracion.patientDataForm")
  const { form, isPending } = usePatientDataForm(initialData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const diabetesTypes = ["Tipo 1", "Tipo 2", "Gestacional", "LADA", "MODY"] as const
  const genderOptions = ["masculino", "femenino", "otro", "prefiero_no_decir"] as const

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("sections.personalInfo")}
          </h3>

          <form.Field name="fullName">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div>
                  <Label htmlFor={field.name}>{t("fields.fullName.label")} *</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("fields.fullName.placeholder")}
                    className="bg-secondary/30"
                    aria-invalid={isInvalid}
                    disabled={isPending}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>

          <form.Field name="phoneNumber">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div>
                  <Label htmlFor={field.name}>{t("fields.phoneNumber.label")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      const value = e.target.value
                      const sanitized = value.startsWith("+")
                        ? "+" + value.slice(1).replace(/\D/g, "")
                        : value.replace(/\D/g, "")
                      field.handleChange(sanitized)
                    }}
                    placeholder={t("fields.phoneNumber.placeholder")}
                    className="bg-secondary/30"
                    maxLength={15}
                    aria-invalid={isInvalid}
                    disabled={isPending}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("sections.medicalInfo")}
          </h3>

          <form.Field name="diabetesType">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div>
                  <Label htmlFor={field.name}>{t("fields.diabetesType.label")} *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(
                        value as "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY"
                      )
                    }
                    disabled={isPending}
                  >
                    <SelectTrigger className="bg-secondary/30" id={field.name} aria-invalid={isInvalid}>
                      <SelectValue placeholder={t("fields.diabetesType.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {diabetesTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t(`fields.diabetesType.types.${type}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>

          <form.Field name="diagnosisYear">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div>
                  <Label htmlFor={field.name}>{t("fields.diagnosisYear.label")}</Label>
                  <Input
                    id={field.name}
                    type="number"
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("fields.diagnosisYear.placeholder", { year: new Date().getFullYear() - 5 })}
                    className="bg-secondary/30"
                    min={1950}
                    max={new Date().getFullYear()}
                    aria-invalid={isInvalid}
                    disabled={isPending}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("sections.additionalInfo")}
          </h3>

          <form.Field name="age">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <div>
                  <Label htmlFor={field.name}>{t("fields.age.label")}</Label>
                  <Input
                    id={field.name}
                    type="number"
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder={t("fields.age.placeholder")}
                    className="bg-secondary/30"
                    min={1}
                    max={120}
                    aria-invalid={isInvalid}
                    disabled={isPending}
                  />
                  {isInvalid && field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )
            }}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("fields.gender.label")}</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(
                      value as
                        | "masculino"
                        | "femenino"
                        | "otro"
                        | "prefiero_no_decir"
                    )
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-secondary/30" id={field.name}>
                    <SelectValue placeholder={t("fields.gender.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {t(`fields.gender.options.${option}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="city">
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>{t("fields.city.label")}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t("fields.city.placeholder")}
                    className="bg-secondary/30"
                    disabled={isPending}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="estrato">
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>{t("fields.estrato.label")}</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="bg-secondary/30" id={field.name}>
                      <SelectValue placeholder={t("fields.estrato.placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((estrato) => (
                        <SelectItem key={estrato} value={estrato.toString()}>
                          {t("fields.estrato.option", { number: estrato })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>
        </div>

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
            values: state.values,
          })}
        >
          {({ canSubmit, isSubmitting, values }) => {
            const hasChanges =
              values.fullName !== initialData.fullName ||
              (values.phoneNumber ?? "") !== (initialData.phoneNumber ?? "") ||
              values.diabetesType !== initialData.diabetesType ||
              (values.diagnosisYear ?? "") !== (initialData.diagnosisYear ?? "") ||
              (values.age ?? "") !== (initialData.age ?? "") ||
              (values.gender ?? "") !== (initialData.gender ?? "") ||
              (values.city ?? "") !== (initialData.city ?? "") ||
              (values.estrato ?? "") !== (initialData.estrato ?? "")

            return (
              <FormActions
                hasChanges={hasChanges}
                canSubmit={canSubmit}
                isSubmitting={isSubmitting}
                isPending={isPending}
                onReset={() => form.reset()}
                t={t}
              />
            )
          }}
        </form.Subscribe>
      </form>
    </div>
  )
}

interface FormActionsProps {
  hasChanges: boolean
  canSubmit: boolean
  isSubmitting: boolean
  isPending: boolean
  onReset: () => void
  t: ReturnType<typeof useTranslations<"Configuracion.patientDataForm">>
}

function FormActions({
  hasChanges,
  canSubmit,
  isSubmitting,
  isPending,
  onReset,
  t,
}: FormActionsProps) {

  return (
    <>
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onReset}
          disabled={isPending || !hasChanges}
        >
          {t("actions.cancel")}
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isPending || isSubmitting || !canSubmit || !hasChanges}
        >
          {isPending ? t("actions.saving") : t("actions.save")}
        </Button>
      </div>
    </>
  )
}
