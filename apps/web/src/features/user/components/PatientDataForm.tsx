"use client"

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

interface PatientDataFormProps {
  initialData: PatientFormData
}

export function PatientDataForm({ initialData }: PatientDataFormProps) {
  const { form, isPending } = usePatientDataForm(initialData)

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
            Información Personal
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

          <form.Field name="phoneNumber">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Teléfono WhatsApp</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value ?? ""}
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

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
            Información Médica
          </h3>

          <form.Field
            name="diabetesType"
            validators={{
              onChange: ({ value }) =>
                !value ? "Tipo de diabetes es requerido" : undefined,
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Tipo de diabetes *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(
                      value as "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY"
                    )
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-secondary/30" id={field.name}>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      ["Tipo 1", "Tipo 2", "Gestacional", "LADA", "MODY"] as const
                    ).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="diagnosisYear"
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined
                const year = parseInt(value)
                if (isNaN(year)) return "El año debe ser un número"
                if (year < 1950) return "El año debe ser posterior a 1950"
                if (year > new Date().getFullYear())
                  return "El año no puede ser futuro"
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Año de diagnóstico</Label>
                <Input
                  id={field.name}
                  type="number"
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={`Ej: ${new Date().getFullYear() - 5}`}
                  className="bg-secondary/30"
                  min={1950}
                  max={new Date().getFullYear()}
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
        </div>

        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
            Información Adicional
          </h3>

          <form.Field name="birthDate">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Fecha de nacimiento</Label>
                <Input
                  id={field.name}
                  type="date"
                  name={field.name}
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="bg-secondary/30"
                  disabled={isPending}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <div>
                <Label htmlFor={field.name}>Sexo</Label>
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
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="prefiero_no_decir">
                      Prefiero no decir
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <div className="grid gap-4 md:grid-cols-2">
            <form.Field name="city">
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>Ciudad de residencia</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value ?? ""}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Ej: Bogotá"
                    className="bg-secondary/30"
                    disabled={isPending}
                  />
                </div>
              )}
            </form.Field>

            <form.Field name="estrato">
              {(field) => (
                <div>
                  <Label htmlFor={field.name}>Estrato</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="bg-secondary/30" id={field.name}>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map((estrato) => (
                        <SelectItem key={estrato} value={estrato.toString()}>
                          Estrato {estrato}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>
          </div>
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
