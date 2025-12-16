"use client";

import { useState } from 'react';
import { ArrowRight, UserPlus, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';

// ============================================
// Form Types
// ============================================

interface PatientFormInput {
  name: string;
  phone: string;
  age: string;
  sex: '' | 'M' | 'F';
  diabetesType: '' | 'Tipo 1' | 'Tipo 2' | 'Gestacional';
  diagnosisYear: string;
  residence: string;
  socioeconomicLevel: string;
}

// ============================================
// Component
// ============================================

export default function OnboardingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: PatientFormInput) => {
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Form data:', data);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col safe-area-inset">
      {/* Hero Background - matching homepage style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[60px]" />
      </div>

      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-hig"
      >
        Saltar al contenido principal
      </a>

      {/* Header - matching homepage */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-hig bg-gradient-purple flex items-center justify-center elevation-1">
              <Activity className="w-[var(--icon-lg)] h-[var(--icon-lg)] text-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-hig-lg text-foreground leading-hig-tight">MurphyIA</h1>
              <span className="text-hig-xs text-muted-foreground">Pro Edition</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="relative z-10 flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto animate-fade-up">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-hig-xl md:text-hig-2xl font-bold text-foreground">Registro de Paciente</h2>
            <p className="text-hig-sm text-muted-foreground">Completa tus datos para comenzar</p>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Datos Personales */}
              <div className="glass-card p-6 space-y-4">
                <h3 className="text-hig-lg font-semibold text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" aria-hidden="true" />
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
                      <FormItem className="md:col-span-2">
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

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
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
                      <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
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
      </main>

      {/* Footer - matching homepage */}
      <footer className="relative z-10 px-6 py-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-hig-sm text-muted-foreground">
          <p>© 2024 MurphyIA</p>
          <p>Versión 1.0.0 - Beta</p>
        </div>
      </footer>
    </div>
  );
}
