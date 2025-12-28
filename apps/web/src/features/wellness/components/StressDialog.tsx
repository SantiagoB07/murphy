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
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Brain } from "lucide-react"
import type { StressFormData } from "../wellness.types"

interface StressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: StressFormData | null
  onSave: (data: StressFormData) => void
}

const STRESS_LEVEL_LABELS: Record<number, string> = {
  1: "Muy relajado",
  2: "Muy relajado",
  3: "Relajado",
  4: "Relajado",
  5: "Normal",
  6: "Normal",
  7: "Estresado",
  8: "Estresado",
  9: "Muy estresado",
  10: "Muy estresado",
}

function getStressColor(level: number): string {
  if (level <= 3) return "text-success"
  if (level <= 5) return "text-warning"
  if (level <= 7) return "text-orange-400"
  return "text-destructive"
}

function getStressBgColor(level: number): string {
  if (level <= 3) return "bg-success/20"
  if (level <= 5) return "bg-warning/20"
  if (level <= 7) return "bg-orange-400/20"
  return "bg-destructive/20"
}

export function StressDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: StressDialogProps) {
  const [level, setLevel] = useState<number>(initialData?.level ?? 5)
  const [notes, setNotes] = useState(initialData?.notes ?? "")

  useEffect(() => {
    if (open) {
      setLevel(initialData?.level ?? 5)
      setNotes(initialData?.notes ?? "")
    }
  }, [open, initialData])

  const handleSubmit = () => {
    onSave({ level, notes: notes.trim() || undefined })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Brain className="w-5 h-5 text-rose-400" />
            Nivel de Estres
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Stress level slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Como te sientes?</Label>
              <span
                className={cn(
                  "text-sm font-medium px-3 py-1 rounded",
                  getStressBgColor(level),
                  getStressColor(level)
                )}
              >
                {STRESS_LEVEL_LABELS[level]} ({level}/10)
              </span>
            </div>

            <Slider
              value={[level]}
              onValueChange={([v]) => setLevel(v)}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Muy relajado</span>
              <span>Normal</span>
              <span>Muy estresado</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stress-notes" className="text-muted-foreground">
              Que te esta causando estres? (opcional)
            </Label>
            <Textarea
              id="stress-notes"
              placeholder="Ej: Trabajo, familia, salud..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
              maxLength={200}
            />
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>El estres elevado puede aumentar la glucosa</p>
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

