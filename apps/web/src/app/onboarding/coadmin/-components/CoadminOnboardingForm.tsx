"use client"

import { Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormActions } from "../../-components/FormActions"
import { useCoadminOnboardingForm } from "./useCoadminOnboardingForm"

interface CoadminOnboardingFormProps {
  patientName?: string
}

export function CoadminOnboardingForm({ patientName }: CoadminOnboardingFormProps) {
  const { form, isPending } = useCoadminOnboardingForm()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Welcome Message */}
      {patientName && (
        <div className="glass-card p-4 bg-primary/10 border-primary/20">
          <p className="text-hig-sm text-foreground">
            Has sido invitado como coadministrador de la cuenta de{" "}
            <span className="font-semibold">{patientName}</span>. 
            Completa tus datos para comenzar.
          </p>
        </div>
      )}

      {/* Datos de Contacto */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-hig-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" aria-hidden="true" />
          Tus Datos de Contacto
        </h3>
        
        <div className="grid gap-4">
          {/* Nombre */}
          <form.Field 
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value ? "El nombre es requerido" : undefined,
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="name">Nombre completo *</Label>
                <Input 
                  id="name"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ej: María García López" 
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

          {/* Teléfono */}
          <form.Field 
            name="phone"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "El teléfono es requerido"
                if (!/^\d*$/.test(value)) return "Solo se permiten números"
                if (value.length < 10) return "El teléfono debe tener al menos 10 dígitos"
                if (value.length > 10) return "El teléfono debe tener máximo 10 dígitos"
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="phone">Teléfono WhatsApp *</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary/50 text-muted-foreground text-sm">
                    +57
                  </span>
                  <Input 
                    id="phone"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      // Only allow numeric input
                      const numericValue = e.target.value.replace(/\D/g, "")
                      field.handleChange(numericValue)
                    }}
                    placeholder="3001234567" 
                    className="rounded-l-none bg-secondary/30"
                    maxLength={10}
                    disabled={isPending}
                  />
                </div>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>
        </div>
      </div>

      {/* Info Box */}
      <div className="glass-card p-4 bg-muted/30">
        <p className="text-hig-xs text-muted-foreground">
          Como coadministrador podrás ver y administrar los datos de salud del paciente, 
          incluyendo registros de glucosa, insulina, alertas y más.
        </p>
      </div>

      <FormActions 
        onReset={() => form.reset()}
        isLoading={isPending}
      />
    </form>
  )
}


