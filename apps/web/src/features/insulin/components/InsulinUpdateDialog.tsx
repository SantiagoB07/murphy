"use client"

import { useTranslations } from "next-intl"
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
import type { InsulinSchedule } from "./InsulinConfigCard"
import type { UpdateInsulinData } from "../hooks/useInsulinSchedule"

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
  const t = useTranslations("Insulina")

  const title = type === "rapid" ? t("configCard.rapid") : t("configCard.basal")

  const schemaWithTranslations = insulinUpdateSchema.extend({
    unitsPerDose: z.number().min(0.5, t("updateDialog.validation.minUnits")).max(100, t("updateDialog.validation.maxUnits")),
  })

  const form = useForm<FormData>({
    resolver: zodResolver(schemaWithTranslations),
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
              {t("updateDialog.updateTitle", { type: title })}
            </DialogTitle>
            <DialogDescription>
              {currentSchedule
                ? t("updateDialog.currentDose", { units: currentSchedule.unitsPerDose, times: currentSchedule.timesPerDay })
                : t("updateDialog.configureFirst")}
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
                  <FormLabel>{t("updateDialog.unitsPerDose")}</FormLabel>
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
                    <FormLabel>{t("updateDialog.dailyFrequency")}</FormLabel>
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
                      ? t("updateDialog.noApplications")
                      : field.value === 1
                        ? t("updateDialog.oncePerDay")
                        : t("updateDialog.timesPerDay", { value: field.value })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Daily total preview */}
            {dailyTotal > 0 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  {t("updateDialog.estimatedDailyTotal")}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {dailyTotal}{" "}
                  <span className="text-base font-normal">{t("configCard.unitsLabel")}</span>
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-[44px]"
              disabled={isLoading}
            >
              {isLoading ? t("updateDialog.saving") : t("updateDialog.saveChanges")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

