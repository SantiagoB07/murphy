"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Syringe, Moon, Brain, Sparkles } from "lucide-react"
import {
  STRESS_LEVEL_LABELS,
  DIZZINESS_SEVERITY_LABELS,
} from "@/types/diabetes"

// ==================== TYPES ====================

export type DailyLogType = "insulin" | "sleep" | "stress" | "dizziness"
export type InsulinVariant = "rapid" | "basal"

interface BaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface InsulinDialogProps extends BaseDialogProps {
  type: "insulin"
  variant: InsulinVariant
  initialValue?: number
  onSave: (units: number, notes?: string) => void
}

interface SleepDialogProps extends BaseDialogProps {
  type: "sleep"
  initialHours?: number
  initialQuality?: number
  onSave: (hours: number, quality?: number) => void
}

interface StressDialogProps extends BaseDialogProps {
  type: "stress"
  initialLevel?: number
  initialNotes?: string
  onSave: (level: number, notes?: string) => void
}

interface DizzinessDialogProps extends BaseDialogProps {
  type: "dizziness"
  initialExperienced?: boolean
  initialSeverity?: number
  initialNotes?: string
  onSave: (data: { experienced: boolean; severity?: number; notes?: string }) => void
}

export type DailyLogInputDialogProps =
  | InsulinDialogProps
  | SleepDialogProps
  | StressDialogProps
  | DizzinessDialogProps

// ==================== CONSTANTS ====================

const INSULIN_LABELS: Record<InsulinVariant, string> = {
  rapid: "Insulina Rapida",
  basal: "Insulina Basal",
}

const DIALOG_CONFIG = {
  insulin: { icon: Syringe, color: "text-blue-400" },
  sleep: { icon: Moon, color: "text-indigo-400" },
  stress: { icon: Brain, color: "text-rose-400" },
  dizziness: { icon: Sparkles, color: "text-pink-400" },
}

// ==================== COMPONENT ====================

export function DailyLogInputDialog(props: DailyLogInputDialogProps) {
  switch (props.type) {
    case "insulin":
      return <InsulinContent {...props} />
    case "sleep":
      return <SleepContent {...props} />
    case "stress":
      return <StressContent {...props} />
    case "dizziness":
      return <DizzinessContent {...props} />
  }
}

// ==================== INSULIN VARIANT ====================

function InsulinContent({
  open,
  onOpenChange,
  variant,
  initialValue,
  onSave,
}: InsulinDialogProps) {
  const [value, setValue] = useState<string>(initialValue?.toString() || "")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue(initialValue?.toString() || "")
      setNotes("")
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, initialValue])

  const numericValue = parseFloat(value)
  const isValid = !isNaN(numericValue) && numericValue > 0 && numericValue <= 100

  const handleSubmit = () => {
    if (!value.trim()) {
      setError("Ingresa las unidades")
      return
    }
    if (!isValid) {
      setError("El valor debe estar entre 0.5 y 100 unidades")
      return
    }
    onSave(numericValue, notes.trim() || undefined)
    onOpenChange(false)
  }

  const Icon = DIALOG_CONFIG.insulin.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.insulin.color)} />
            {INSULIN_LABELS[variant]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="insulin-value" className="text-muted-foreground">
              Unidades aplicadas
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="insulin-value"
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="10"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(null)
                }}
                className={cn(
                  "text-2xl font-bold text-center h-16 pr-12",
                  error ? "border-destructive" : ""
                )}
                min={0.5}
                max={100}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                U
              </span>
            </div>

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="insulin-notes" className="text-muted-foreground">
              Notas (opcional)
            </Label>
            <Textarea
              id="insulin-notes"
              placeholder="Ej: Dosis ajustada por medico..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
              maxLength={200}
            />
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p className="flex items-center gap-1">
              <Syringe className="w-3 h-3" />
              {variant === "rapid"
                ? "Insulina de accion rapida para las comidas"
                : "Insulina de accion prolongada (1-2 veces/dia)"}
            </p>
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
            disabled={!value.trim()}
            className="flex-1 sm:flex-none"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== SLEEP VARIANT ====================

function SleepContent({
  open,
  onOpenChange,
  initialHours,
  initialQuality,
  onSave,
}: SleepDialogProps) {
  const [hours, setHours] = useState<number>(initialHours ?? 7)
  const [quality, setQuality] = useState<number>(initialQuality ?? 5)

  useEffect(() => {
    if (open) {
      setHours(initialHours ?? 7)
      setQuality(initialQuality ?? 5)
    }
  }, [open, initialHours, initialQuality])

  const handleSubmit = () => {
    onSave(hours, quality)
    onOpenChange(false)
  }

  const Icon = DIALOG_CONFIG.sleep.icon
  const getSleepQualityLabel = (q: number) => {
    if (q <= 3) return "Malo"
    if (q <= 5) return "Regular"
    if (q <= 7) return "Bueno"
    return "Excelente"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.sleep.color)} />
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

// ==================== STRESS VARIANT (SIMPLIFIED - NO EMOJIS) ====================

function StressContent({
  open,
  onOpenChange,
  initialLevel,
  initialNotes,
  onSave,
}: StressDialogProps) {
  const [level, setLevel] = useState<number>(initialLevel ?? 5)
  const [notes, setNotes] = useState(initialNotes ?? "")

  useEffect(() => {
    if (open) {
      setLevel(initialLevel ?? 5)
      setNotes(initialNotes ?? "")
    }
  }, [open, initialLevel, initialNotes])

  const handleSubmit = () => {
    onSave(level, notes.trim() || undefined)
    onOpenChange(false)
  }

  const Icon = DIALOG_CONFIG.stress.icon

  const getStressColor = (l: number) => {
    if (l <= 3) return "text-success"
    if (l <= 5) return "text-warning"
    if (l <= 7) return "text-orange-400"
    return "text-destructive"
  }

  const getStressBgColor = (l: number) => {
    if (l <= 3) return "bg-success/20"
    if (l <= 5) return "bg-warning/20"
    if (l <= 7) return "bg-orange-400/20"
    return "bg-destructive/20"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.stress.color)} />
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

// ==================== DIZZINESS VARIANT (SIMPLIFIED - YES/NO + SLIDER) ====================

function DizzinessContent({
  open,
  onOpenChange,
  initialExperienced,
  initialSeverity,
  initialNotes,
  onSave,
}: DizzinessDialogProps) {
  const [experienced, setExperienced] = useState<boolean | null>(
    initialExperienced ?? null
  )
  const [severity, setSeverity] = useState<number>(initialSeverity ?? 5)
  const [notes, setNotes] = useState(initialNotes ?? "")

  useEffect(() => {
    if (open) {
      setExperienced(initialExperienced ?? null)
      setSeverity(initialSeverity ?? 5)
      setNotes(initialNotes ?? "")
    }
  }, [open, initialExperienced, initialSeverity, initialNotes])

  const handleSubmit = () => {
    if (experienced === null) return

    if (experienced) {
      onSave({ experienced: true, severity, notes: notes.trim() || undefined })
    } else {
      onSave({ experienced: false })
    }
    onOpenChange(false)
  }

  const Icon = DIALOG_CONFIG.dizziness.icon

  const getSeverityColor = (s: number) => {
    if (s <= 3) return "text-success"
    if (s <= 5) return "text-warning"
    if (s <= 7) return "text-orange-400"
    return "text-destructive"
  }

  const getSeverityBgColor = (s: number) => {
    if (s <= 3) return "bg-success/20"
    if (s <= 5) return "bg-warning/20"
    if (s <= 7) return "bg-orange-400/20"
    return "bg-destructive/20"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.dizziness.color)} />
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
