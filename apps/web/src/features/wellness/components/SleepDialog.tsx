"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Moon } from "lucide-react"
import type { SleepFormData } from "../wellness.types"

interface SleepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: SleepFormData | null
  onSave: (data: SleepFormData) => void
}

function getSleepQualityLabel(quality: number): string {
  if (quality <= 3) return "Malo"
  if (quality <= 5) return "Regular"
  if (quality <= 7) return "Bueno"
  return "Excelente"
}

export function SleepDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: SleepDialogProps) {
  const [hours, setHours] = useState<number>(initialData?.hours ?? 7)
  const [quality, setQuality] = useState<number>(initialData?.quality ?? 5)

  useEffect(() => {
    if (open) {
      setHours(initialData?.hours ?? 7)
      setQuality(initialData?.quality ?? 5)
    }
  }, [open, initialData])

  const handleSubmit = () => {
    onSave({ hours, quality })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Moon className="w-5 h-5 text-indigo-400" />
            Registro de Sueno
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hours slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Horas dormidas</Label>
              <span className="text-2xl font-bold text-foreground">{hours}h</span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={([v]) => setHours(v)}
              min={0}
              max={12}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
          </div>

          {/* Quality slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Calidad del sueno</Label>
              <span
                className={cn(
                  "text-sm font-medium px-2 py-1 rounded",
                  quality <= 3
                    ? "bg-destructive/20 text-destructive"
                    : quality <= 5
                      ? "bg-warning/20 text-warning"
                      : quality <= 7
                        ? "bg-success/20 text-success"
                        : "bg-primary/20 text-primary"
                )}
              >
                {getSleepQualityLabel(quality)} ({quality}/10)
              </span>
            </div>
            <Slider
              value={[quality]}
              onValueChange={([v]) => setQuality(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>Dormir 7-9 horas ayuda a regular la glucosa</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

