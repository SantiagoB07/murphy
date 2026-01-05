"use client"

import { useTranslations } from "next-intl"
import { User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCoadminProfileForm } from "../hooks/useCoadminProfileForm"
import type { CoadminProfileFormData } from "../user.types"

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

          <form.Field
            name="fullName"
            validators={{
              onChange: ({ value }) =>
                !value ? t("fields.fullName.required") : undefined,
            }}
          >
            {(field) => (
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
                  disabled={isPending}
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="phoneNumber">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>{t("fields.phoneNumber.label")}</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "")
                    field.handleChange(numericValue)
                  }}
                  placeholder={t("fields.phoneNumber.placeholder")}
                  className="bg-secondary/30"
                  maxLength={10}
                  disabled={isPending}
                />
              </div>
            )}
          </form.Field>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => form.reset()}
            disabled={isPending}
          >
            {t("actions.cancel")}
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? t("actions.saving") : t("actions.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}
