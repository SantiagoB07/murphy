"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, Loader2, UserPlus, ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { createPatient, createCoadmin } from '@/app/lib/actions/patients';
import type { CreatePatientInput } from '@/app/lib/services/patients';
import type { CreateCoadminInput } from '@/app/lib/services/coadmins';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible';

// ============================================
// Validation Schema
// ============================================

const phoneRegex = /^\d{10}$/;

const patientFormSchema = z.object({
  // Datos personales (requeridos)
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(phoneRegex, 'Ingresa 10 dígitos sin espacios'),
  
  // Datos personales (opcionales)
  age: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  sex: z.enum(['M', 'F', '']).optional().transform((val) => val || undefined),
  
  // Info médica (opcional)
  diabetesType: z.enum(['Tipo 1', 'Tipo 2', 'Gestacional', '']).optional().transform((val) => val || undefined),
  diagnosisYear: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  
  // Ubicación (opcional)
  residence: z.string().optional().transform((val) => val || undefined),
  socioeconomicLevel: z.string().optional().transform((val) => val ? parseInt(val, 10) : undefined),
  
  // Coadmin (opcional)
  hasCoadmin: z.boolean(),
  coadminName: z.string().optional().transform((val) => val || undefined),
  coadminPhone: z.string().optional().refine((val) => !val || phoneRegex.test(val), 'Ingresa 10 dígitos sin espacios'),
});

// Form input types (before transform)
interface PatientFormInput {
  name: string;
  phone: string;
  age: string;
  sex: '' | 'M' | 'F';
  diabetesType: '' | 'Tipo 1' | 'Tipo 2' | 'Gestacional';
  diagnosisYear: string;
  residence: string;
  socioeconomicLevel: string;
  hasCoadmin: boolean;
  coadminName: string;
  coadminPhone: string;
}

type PatientFormValues = z.infer<typeof patientFormSchema>;

// ============================================
// Component Props
// ============================================

interface PatientRegistrationFormProps {
  onBack: () => void;
}

// ============================================
// Component
// ============================================

export function PatientRegistrationForm({ onBack }: PatientRegistrationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PatientFormInput>({
    defaultValues: {
      name: '',
      phone: '',
      age: '',
      sex: '',
      diabetesType: '',
      diagnosisYear: '',
      residence: '',
      socioeconomicLevel: '',
      hasCoadmin: false,
      coadminName: '',
      coadminPhone: '',
    },
    mode: 'onBlur',
  });

  const hasCoadmin = form.watch('hasCoadmin');

  const onSubmit = async (data: PatientFormInput) => {
    // Validate with zod
    const result = patientFormSchema.safeParse(data);
    if (!result.success) {
      setSubmitError('Por favor verifica los datos del formulario.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Create patient
      const patientInput: CreatePatientInput = {
        name: data.name,
        phone: `+57${data.phone}`,
        age: data.age ? parseInt(data.age, 10) : null,
        sex: data.sex || null,
        diabetes_type: data.diabetesType || null,
        diagnosis_year: data.diagnosisYear ? parseInt(data.diagnosisYear, 10) : null,
        residence: data.residence || null,
        socioeconomic_level: data.socioeconomicLevel ? parseInt(data.socioeconomicLevel, 10) : null,
        timezone: 'America/Bogota',
      };

      const patient = await createPatient(patientInput);
      
      if (!patient) {
        setSubmitError('Error al crear el paciente. Por favor intenta de nuevo.');
        setIsSubmitting(false);
        return;
      }

      // 2. Create coadmin if provided
      if (data.hasCoadmin && data.coadminName && data.coadminPhone) {
        const coadminInput: CreateCoadminInput = {
          name: data.coadminName,
          phone: `+57${data.coadminPhone}`,
          patient_id: patient.id,
        };

        const coadmin = await createCoadmin(coadminInput);
        
        if (!coadmin) {
          // Patient was created but coadmin failed - continue anyway
          console.warn('Coadmin creation failed, but patient was created successfully');
        }
      }

      // 3. Store patient ID and redirect to dashboard
      localStorage.setItem('murphy-patient-id', patient.id);
      localStorage.setItem('userRole', 'patient');
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Error in form submission:', error);
      setSubmitError('Ocurrió un error inesperado. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-hig hover:bg-secondary/50 transition-colors focus-ring"
          aria-label="Volver a selección de rol"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h2 className="text-hig-xl font-bold text-foreground">Registro de Paciente</h2>
          <p className="text-hig-sm text-muted-foreground">Completa tus datos para comenzar</p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Datos Personales */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-hig-lg font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Datos Personales
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Nombre */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: María García López" 
                        {...field}
                        className="bg-secondary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Teléfono */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono WhatsApp *</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary/50 text-muted-foreground text-sm">
                          +57
                        </span>
                        <Input 
                          placeholder="3001234567" 
                          {...field}
                          className="rounded-l-none bg-secondary/30"
                          maxLength={10}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Edad */}
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Edad</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Ej: 45" 
                        {...field}
                        className="bg-secondary/30"
                        min={1}
                        max={120}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sexo */}
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/30">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Información Médica */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-hig-lg font-semibold text-foreground">Información Médica</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Tipo de Diabetes */}
              <FormField
                control={form.control}
                name="diabetesType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de diabetes</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/30">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tipo 1">Tipo 1</SelectItem>
                        <SelectItem value="Tipo 2">Tipo 2</SelectItem>
                        <SelectItem value="Gestacional">Gestacional</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Año de Diagnóstico */}
              <FormField
                control={form.control}
                name="diagnosisYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año de diagnóstico</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder={`Ej: ${new Date().getFullYear() - 5}`}
                        {...field}
                        className="bg-secondary/30"
                        min={1950}
                        max={new Date().getFullYear()}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Ubicación */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-hig-lg font-semibold text-foreground">Ubicación</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Ciudad de Residencia */}
              <FormField
                control={form.control}
                name="residence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad de residencia</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Bogotá" 
                        {...field}
                        className="bg-secondary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estrato Socioeconómico */}
              <FormField
                control={form.control}
                name="socioeconomicLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estrato socioeconómico</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="bg-secondary/30">
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Estrato 1</SelectItem>
                        <SelectItem value="2">Estrato 2</SelectItem>
                        <SelectItem value="3">Estrato 3</SelectItem>
                        <SelectItem value="4">Estrato 4</SelectItem>
                        <SelectItem value="5">Estrato 5</SelectItem>
                        <SelectItem value="6">Estrato 6</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Co-administrador (colapsable) */}
          <Collapsible open={hasCoadmin} onOpenChange={(open) => form.setValue('hasCoadmin', open)}>
            <div className="glass-card p-6 space-y-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={hasCoadmin} 
                    onCheckedChange={(checked) => form.setValue('hasCoadmin', !!checked)}
                  />
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="text-left"
                    >
                      <h3 className="text-hig-lg font-semibold text-foreground">Agregar Co-administrador</h3>
                      <p className="text-hig-sm text-muted-foreground">
                        Persona que te ayudará a monitorear tu salud (opcional)
                      </p>
                    </button>
                  </CollapsibleTrigger>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  hasCoadmin && "rotate-180"
                )} />
              </div>
              
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Nombre del Coadmin */}
                  <FormField
                    control={form.control}
                    name="coadminName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del co-administrador</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ej: Juan García" 
                            {...field}
                            className="bg-secondary/30"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Teléfono del Coadmin */}
                  <FormField
                    control={form.control}
                    name="coadminPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono del co-administrador</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary/50 text-muted-foreground text-sm">
                              +57
                            </span>
                            <Input 
                              placeholder="3009876543" 
                              {...field}
                              className="rounded-l-none bg-secondary/30"
                              maxLength={10}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Error Message */}
          {submitError && (
            <div className="p-4 rounded-hig bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {submitError}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "btn-neon flex items-center gap-2 px-8 py-4 text-hig-lg focus-ring",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  Comenzar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
