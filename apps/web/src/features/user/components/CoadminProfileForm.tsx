"use client"

import { useTranslations } from "next-intl"
import { User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCoadminProfileForm } from "../hooks/useCoadminProfileForm"
import type { CoadminProfileFormData } from "../user.types"

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return String(error)
}

interface CoadminProfileFormProps {
  initialData: CoadminProfileFormData
}

export function CoadminProfileForm({ initialData }: CoadminProfileFormProps) {
  const t = useTranslations("Configuracion.coadminProfileForm")
  const { form, isPending } = useCoadminProfileForm(initialData)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" aria-hidden="true" />
            {t("title")}
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
              (values.phoneNumber ?? "") !== (initialData.phoneNumber ?? "")

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
  t: ReturnType<typeof useTranslations<"Configuracion.coadminProfileForm">>
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
