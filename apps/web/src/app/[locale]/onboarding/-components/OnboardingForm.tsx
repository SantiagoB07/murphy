"use client";

import { UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FormActions } from './FormActions';
import { useOnboardingForm } from './useOnboardingForm';

export function OnboardingForm() {
  const { form, isPending } = useOnboardingForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Datos Personales */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-hig-lg font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" aria-hidden="true" />
          Datos Personales
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Nombre */}
          <form.Field 
            name="name"
            validators={{
              onChange: ({ value }) =>
                !value ? 'El nombre es requerido' : undefined,
            }}
          >
            {(field) => (
              <div className="md:col-span-2">
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
                if (!value) return 'El teléfono es requerido';
                if (!/^\d*$/.test(value)) return 'Solo se permiten números';
                if (value.length < 10) return 'El teléfono debe tener al menos 10 dígitos';
                if (value.length > 10) return 'El teléfono debe tener máximo 10 dígitos';
                return undefined;
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
                      const numericValue = e.target.value.replace(/\D/g, '');
                      field.handleChange(numericValue);
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

          {/* Edad */}
          <form.Field 
            name="age"
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined; // Optional field
                const age = parseInt(value);
                if (isNaN(age)) return 'La edad debe ser un número';
                if (age < 1) return 'La edad debe ser mayor a 0';
                if (age > 120) return 'La edad debe ser menor a 120';
                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="age">Edad</Label>
                <Input 
                  id="age"
                  type="number"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ej: 45" 
                  className="bg-secondary/30"
                  min={1}
                  max={120}
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

          {/* Sexo */}
          <form.Field 
            name="sex"
            validators={{
              onChange: ({ value }) =>
                !value ? 'El sexo es requerido' : undefined,
            }}
          >
            {(field) => (
              <div className="md:col-span-2">
                <Label htmlFor="sex">Sexo *</Label>
                <Select 
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir')}
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-secondary/30" id="sex">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
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
        </div>
      </div>

      {/* Información Médica */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-hig-lg font-semibold text-foreground">Información Médica</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Tipo de Diabetes */}
          <form.Field 
            name="diabetesType"
            validators={{
              onChange: ({ value }) =>
                !value ? 'El tipo de diabetes es requerido' : undefined,
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="diabetesType">Tipo de diabetes *</Label>
                <Select 
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY')}
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-secondary/30" id="diabetesType">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tipo 1">Tipo 1</SelectItem>
                    <SelectItem value="Tipo 2">Tipo 2</SelectItem>
                    <SelectItem value="Gestacional">Gestacional</SelectItem>
                    <SelectItem value="LADA">LADA</SelectItem>
                    <SelectItem value="MODY">MODY</SelectItem>
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

          {/* Año de Diagnóstico */}
          <form.Field 
            name="diagnosisYear"
            validators={{
              onChange: ({ value }) => {
                if (!value) return undefined; // Optional field
                const year = parseInt(value);
                if (isNaN(year)) return 'El año debe ser un número';
                if (year < 1950) return 'El año debe ser posterior a 1950';
                if (year > new Date().getFullYear()) return 'El año no puede ser futuro';
                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="diagnosisYear">Año de diagnóstico</Label>
                <Input 
                  id="diagnosisYear"
                  type="number"
                  name={field.name}
                  value={field.state.value}
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
      </div>

      {/* Ubicación */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-hig-lg font-semibold text-foreground">Ubicación</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* Ciudad de Residencia */}
          <form.Field name="residence">
            {(field) => (
              <div>
                <Label htmlFor="residence">Ciudad de residencia</Label>
                <Input 
                  id="residence"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Ej: Bogotá" 
                  className="bg-secondary/30"
                  disabled={isPending}
                />
              </div>
            )}
          </form.Field>

          {/* Estrato Socioeconómico */}
          <form.Field name="socioeconomicLevel">
            {(field) => (
              <div>
                <Label htmlFor="socioeconomicLevel">Estrato socioeconómico</Label>
                <Select 
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="bg-secondary/30" id="socioeconomicLevel">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Estrato 1</SelectItem>
                    <SelectItem value="2">Estrato 2</SelectItem>
                    <SelectItem value="3">Estrato 3</SelectItem>
                    <SelectItem value="4">Estrato 4</SelectItem>
                    <SelectItem value="5">Estrato 5</SelectItem>
                    <SelectItem value="6">Estrato 6</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <FormActions 
        onReset={() => form.reset()}
        isLoading={isPending}
      />
    </form>
  );
}
