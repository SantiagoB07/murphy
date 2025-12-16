import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { DiabetesType } from '@/types/diabetes';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Ingresa un email válido'),
  phone: z.string().optional(),
  birthDate: z.date({ required_error: 'Selecciona tu fecha de nacimiento' }),
  diabetesType: z.enum(['Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY'] as const),
});

type FormValues = z.infer<typeof formSchema>;

interface PersonalDataSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DIABETES_TYPES: DiabetesType[] = ['Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY'];

export function PersonalDataSheet({ open, onOpenChange }: PersonalDataSheetProps) {
  const { toast } = useToast();
  const { user, profile, patientProfile, isDemoMode, refreshProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      birthDate: undefined,
      diabetesType: 'Tipo 1',
    },
  });

  // Populate form with real data when available
  useEffect(() => {
    if (profile && patientProfile && user) {
      form.reset({
        name: profile.full_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        birthDate: patientProfile.birth_date ? new Date(patientProfile.birth_date) : undefined,
        diabetesType: patientProfile.diabetes_type as DiabetesType,
      });
    }
  }, [profile, patientProfile, user, form]);

  const onSubmit = async (data: FormValues) => {
    if (isDemoMode) {
      toast({ title: 'Modo demo', description: 'Los cambios no se guardan en modo demo' });
      onOpenChange(false);
      return;
    }

    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.name, phone: data.phone || null })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update patient_profiles table
      const { error: patientError } = await supabase
        .from('patient_profiles')
        .update({
          birth_date: format(data.birthDate, 'yyyy-MM-dd'),
          diabetes_type: data.diabetesType,
        })
        .eq('user_id', user.id);

      if (patientError) throw patientError;

      await refreshProfile();
      toast({ title: 'Datos actualizados', description: 'Tus datos personales se han guardado correctamente.' });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: 'Error', description: 'No se pudieron guardar los cambios', variant: 'destructive' });
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
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Tu nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@email.com" {...field} disabled className="bg-muted" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">El email no puede modificarse</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono (opcional)</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+52 555 000 0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Seleccionar fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diabetesType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de diabetes</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DIABETES_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
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
