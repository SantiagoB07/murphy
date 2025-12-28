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
import { Sparkles } from "lucide-react"
import type { DizzinessFormData } from "../wellness.types"

interface DizzinessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: DizzinessFormData | null
  onSave: (data: DizzinessFormData) => void
}

const DIZZINESS_SEVERITY_LABELS: Record<number, string> = {
  1: "Muy leve",
  2: "Muy leve",
  3: "Leve",
  4: "Leve",
  5: "Moderado",
  6: "Moderado",
  7: "Fuerte",
  8: "Fuerte",
  9: "Severo",
  10: "Severo",
}

function getSeverityColor(severity: number): string {
  if (severity <= 3) return "text-success"
  if (severity <= 5) return "text-warning"
  if (severity <= 7) return "text-orange-400"
  return "text-destructive"
}

function getSeverityBgColor(severity: number): string {
  if (severity <= 3) return "bg-success/20"
  if (severity <= 5) return "bg-warning/20"
  if (severity <= 7) return "bg-orange-400/20"
  return "bg-destructive/20"
}

export function DizzinessDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: DizzinessDialogProps) {
  const [experienced, setExperienced] = useState<boolean | null>(
    initialData?.experienced ?? null
  )
  const [severity, setSeverity] = useState<number>(initialData?.severity ?? 5)
  const [notes, setNotes] = useState(initialData?.notes ?? "")

  useEffect(() => {
    if (open) {
      setExperienced(initialData?.experienced ?? null)
      setSeverity(initialData?.severity ?? 5)
      setNotes(initialData?.notes ?? "")
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (experienced === null) return

    if (experienced) {
      onSave({ experienced: true, severity, notes: notes.trim() || undefined })
    } else {
      onSave({ experienced: false })
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-pink-400" />
            Registro de Mareos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Yes/No question */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">
              Experimentaste mareos hoy?
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={experienced === true ? "default" : "outline"}
                onClick={() => setExperienced(true)}
                className={cn(
                  "h-12",
                  experienced === true && "ring-2 ring-primary"
                )}
              >
                Si
              </Button>
              <Button
                type="button"
                variant={experienced === false ? "default" : "outline"}
                onClick={() => setExperienced(false)}
                className={cn(
                  "h-12",
                  experienced === false && "ring-2 ring-primary"
                )}
              >
                No
              </Button>
            </div>
          </div>

          {/* Show severity slider only if experienced === true */}
          {experienced === true && (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">
                    Intensidad del mareo
                  </Label>
                  <span
                    className={cn(
                      "text-sm font-medium px-3 py-1 rounded",
                      getSeverityBgColor(severity),
                      getSeverityColor(severity)
                    )}
                  >
                    {DIZZINESS_SEVERITY_LABELS[severity]} ({severity}/10)
                  </span>
                </div>

                <Slider
                  value={[severity]}
                  onValueChange={([v]) => setSeverity(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Muy leve</span>
                  <span>Moderado</span>
                  <span>Severo</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dizziness-notes" className="text-muted-foreground">
                  Notas (opcional)
                </Label>
                <Textarea
                  id="dizziness-notes"
                  placeholder="Ej: Ocurrio despues de levantarme..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none h-16"
                  maxLength={200}
                />
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>Los mareos pueden indicar cambios en glucosa</p>
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
          <Button
            onClick={handleSubmit}
            disabled={experienced === null}
            className="flex-1 sm:flex-none"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

