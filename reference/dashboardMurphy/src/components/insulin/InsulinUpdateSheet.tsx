import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Syringe } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  InsulinSchedule, 
  RAPID_INSULIN_BRANDS, 
  BASAL_INSULIN_BRANDS 
} from '@/types/diabetes';
import { UpdateInsulinData } from '@/hooks/useInsulinSchedule';

const insulinUpdateSchema = z.object({
  unitsPerDose: z.number().min(0.5, 'Mínimo 0.5 U').max(100, 'Máximo 100 U'),
  timesPerDay: z.number().min(1).max(6),
  brand: z.string().optional(),
  effectiveFrom: z.date().refine(d => d <= new Date(), 'La fecha no puede ser futura'),
  changeReason: z.string().max(500).optional(),
  orderedBy: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof insulinUpdateSchema>;

interface InsulinUpdateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'rapid' | 'basal';
  currentSchedule: InsulinSchedule | null;
  onSave: (data: UpdateInsulinData) => void;
  isLoading?: boolean;
}

export function InsulinUpdateSheet({
  open,
  onOpenChange,
  type,
  currentSchedule,
  onSave,
  isLoading,
}: InsulinUpdateSheetProps) {
  const brands = type === 'rapid' ? RAPID_INSULIN_BRANDS : BASAL_INSULIN_BRANDS;
  const maxFrequency = type === 'rapid' ? 6 : 2;
  const title = type === 'rapid' ? 'Insulina Rápida' : 'Insulina Basal';

  const form = useForm<FormData>({
    resolver: zodResolver(insulinUpdateSchema),
    defaultValues: {
      unitsPerDose: currentSchedule?.unitsPerDose ?? 0,
      timesPerDay: currentSchedule?.timesPerDay ?? 1,
      brand: currentSchedule?.brand ?? '',
      effectiveFrom: new Date(),
      changeReason: '',
      orderedBy: '',
      notes: '',
    },
  });

  const handleSubmit = (data: FormData) => {
    onSave({
      unitsPerDose: data.unitsPerDose,
      timesPerDay: data.timesPerDay,
      brand: data.brand,
      effectiveFrom: data.effectiveFrom,
      changeReason: data.changeReason,
      orderedBy: data.orderedBy,
      notes: data.notes,
    });
  };

  const watchedUnits = form.watch('unitsPerDose');
  const watchedTimes = form.watch('timesPerDay');
  const dailyTotal = (watchedUnits || 0) * (watchedTimes || 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            Actualizar {title}
          </SheetTitle>
          <SheetDescription>
            {currentSchedule
              ? `Dosis actual: ${currentSchedule.unitsPerDose}U × ${currentSchedule.timesPerDay}/día`
              : 'Configura tu primera dosis'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
            {/* Units per dose */}
            <FormField
              control={form.control}
              name="unitsPerDose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidades por aplicación</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="100"
                        placeholder="0"
                        className="w-24 text-center text-lg font-medium"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-muted-foreground">U</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency */}
            <FormField
              control={form.control}
              name="timesPerDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia diaria</FormLabel>
                  <FormControl>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from({ length: maxFrequency }, (_, i) => i + 1).map((num) => (
                        <Button
                          key={num}
                          type="button"
                          variant={field.value === num ? 'default' : 'outline'}
                          size="sm"
                          className="min-w-[44px] h-[44px]"
                          onClick={() => field.onChange(num)}
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    {field.value === 1 ? '1 vez al día' : `${field.value} veces al día`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Daily total preview */}
            {dailyTotal > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total diario estimado</p>
                <p className="text-2xl font-bold text-primary">
                  {dailyTotal} <span className="text-base font-normal">unidades</span>
                </p>
              </div>
            )}

            {/* Brand */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca (opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Effective date */}
            <FormField
              control={form.control}
              name="effectiveFrom"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha efectiva</FormLabel>
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
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Desde cuándo aplica este cambio
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Change reason */}
            {currentSchedule && (
              <FormField
                control={form.control}
                name="changeReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo del cambio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ej: Ajuste por HbA1c elevada"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Ordered by (doctor) */}
            <FormField
              control={form.control}
              name="orderedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Médico que ordenó (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. García" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones adicionales..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-[44px]" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
