'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { useToast } from '@/app/hooks/use-toast';
import { updatePatient } from '@/app/lib/actions/patients';
import type { Patient } from '@/app/types/diabetes';

// Form input types
interface PersonalDataFormInput {
  name: string;
  phone: string;
  age: string;
  sex: '' | 'M' | 'F';
  diabetesType: '' | 'Tipo 1' | 'Tipo 2' | 'Gestacional';
  diagnosisYear: string;
  residence: string;
  socioeconomicLevel: string;
}

interface PersonalDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  onSave?: () => void;
}

export function PersonalDataSheet({ open, onOpenChange, patient, onSave }: PersonalDataSheetProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract phone without +57 prefix for display
  const getPhoneWithoutPrefix = (phone: string) => {
    if (phone.startsWith('+57')) {
      return phone.slice(3);
    }
    return phone;
  };

  const form = useForm<PersonalDataFormInput>({
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
  });

  // Reset form when patient changes or sheet opens
  useEffect(() => {
    if (open && patient) {
      form.reset({
        name: patient.name || '',
        phone: getPhoneWithoutPrefix(patient.phone || ''),
        age: patient.age ? patient.age.toString() : '',
        sex: (patient.sex as '' | 'M' | 'F') || '',
        diabetesType: patient.diabetesType || '',
        diagnosisYear: patient.diagnosisYear?.toString() || '',
        residence: patient.residence || '',
        socioeconomicLevel: patient.estrato ? patient.estrato.toString() : '',
      });
    }
  }, [open, patient, form]);

  const onSubmit = async (data: PersonalDataFormInput) => {
    setIsSubmitting(true);

    try {
      const result = await updatePatient(patient.id, {
        name: data.name,
        phone: data.phone ? `+57${data.phone}` : undefined,
        age: data.age ? parseInt(data.age, 10) : null,
        sex: data.sex || null,
        diabetes_type: data.diabetesType || null,
        diagnosis_year: data.diagnosisYear ? parseInt(data.diagnosisYear, 10) : null,
        residence: data.residence || null,
        socioeconomic_level: data.socioeconomicLevel ? parseInt(data.socioeconomicLevel, 10) : null,
      });

      if (result) {
        toast({
          title: 'Datos actualizados',
          description: 'Tus datos personales se han guardado correctamente.',
        });
        onSave?.();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron guardar los cambios. Intenta de nuevo.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Datos personales</SheetTitle>
          <SheetDescription>
            Actualiza tu información personal
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'El nombre es requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: María García López" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Teléfono */}
            <FormField
              control={form.control}
              name="phone"
              rules={{ 
                required: 'El teléfono es requerido',
                pattern: { value: /^\d{10}$/, message: 'Ingresa 10 dígitos' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono WhatsApp *</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                        +57
                      </span>
                      <Input 
                        placeholder="3001234567" 
                        {...field}
                        className="rounded-l-none"
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            {/* Tipo de Diabetes */}
            <FormField
              control={form.control}
              name="diabetesType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de diabetes</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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
                      min={1950}
                      max={new Date().getFullYear()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ciudad de Residencia */}
            <FormField
              control={form.control}
              name="residence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad de residencia</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Bogotá" {...field} />
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
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
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

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
