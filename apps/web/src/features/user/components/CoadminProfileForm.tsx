"use client"

import { User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCoadminProfileForm } from "../hooks/useCoadminProfileForm"
import { ConfiguracionSkeleton } from "@/app/[locale]/(dashboard)/configuracion/-components/ConfiguracionSkeleton"

export function CoadminProfileForm() {
  const { form, isPending, isLoading } = useCoadminProfileForm()

  if (isLoading) {
    return <ConfiguracionSkeleton />
  }

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
            Mi Perfil
          </h3>

          <form.Field
            name="fullName"
            validators={{
              onChange: ({ value }) =>
                !value ? "Nombre es requerido" : undefined,
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Nombre completo *</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ej: Juan Pérez"
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
                <Label htmlFor={field.name}>Teléfono WhatsApp</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, "")
                    field.handleChange(numericValue)
                  }}
                  placeholder="3001234567"
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
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </div>
  )
}
