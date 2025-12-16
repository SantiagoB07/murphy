"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Syringe } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import type { InsulinSchedule } from "@/types/diabetes"
import type { UpdateInsulinData } from "@/hooks/useInsulinSchedule"

const insulinUpdateSchema = z.object({
  unitsPerDose: z.number().min(0.5, "Minimo 0.5 U").max(100, "Maximo 100 U"),
  timesPerDay: z.number().min(0).max(10),
})

type FormData = z.infer<typeof insulinUpdateSchema>

interface InsulinUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "rapid" | "basal"
  currentSchedule: InsulinSchedule | null
  onSave: (data: UpdateInsulinData) => void
  isLoading?: boolean
}

export function InsulinUpdateDialog({
  open,
  onOpenChange,
  type,
  currentSchedule,
  onSave,
  isLoading,
}: InsulinUpdateDialogProps) {
  const title = type === "rapid" ? "Insulina Rapida" : "Insulina Basal"

  const form = useForm<FormData>({
    resolver: zodResolver(insulinUpdateSchema),
    defaultValues: {
      unitsPerDose: currentSchedule?.unitsPerDose ?? 0,
      timesPerDay: currentSchedule?.timesPerDay ?? 1,
    },
  })

  const handleSubmit = (data: FormData) => {
    onSave({
      unitsPerDose: data.unitsPerDose,
      timesPerDay: data.timesPerDay,
    })
  }

  const watchedUnits = form.watch("unitsPerDose")
  const watchedTimes = form.watch("timesPerDay")
  const dailyTotal = (watchedUnits || 0) * (watchedTimes || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            Actualizar {title}
          </DialogTitle>
          <DialogDescription>
            {currentSchedule
              ? `Dosis actual: ${currentSchedule.unitsPerDose}U x ${currentSchedule.timesPerDay}/dia`
              : "Configura tu primera dosis"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Units per dose */}
            <FormField
              control={form.control}
              name="unitsPerDose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidades por aplicacion</FormLabel>
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
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                      <span className="text-muted-foreground">U</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Frequency - Slider */}
            <FormField
              control={form.control}
              name="timesPerDay"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Frecuencia diaria</FormLabel>
                    <span className="text-lg font-bold text-primary">
                      {field.value}x
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(values) => field.onChange(values[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value === 0
                      ? "Sin aplicaciones"
                      : field.value === 1
                        ? "1 vez al dia"
                        : `${field.value} veces al dia`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Daily total preview */}
            {dailyTotal > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  Total diario estimado
                </p>
                <p className="text-2xl font-bold text-primary">
                  {dailyTotal}{" "}
                  <span className="text-base font-normal">unidades</span>
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-[44px]"
              disabled={isLoading}
            >
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
