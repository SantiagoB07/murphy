"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Droplets } from "lucide-react"
import type { Doc, Id } from "@murphy/backend/convex/_generated/dataModel"
import type { GlucoseSlot, GlucoseFormData } from "../glucose.types"
import { useGlucoseDialog } from "../context/GlucoseDialogContext"
import { useGlucoseMutations } from "../hooks/useGlucoseMutations"

// ============================================================================
// Constants
// ============================================================================

const GLUCOSE_RANGES = {
  critical_low: 54,
  low: 90,
  high: 140,
  critical_high: 250,
}

const GLUCOSE_SLOTS: GlucoseSlot[] = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_dinner",
  "after_dinner",
]

const GLUCOSE_SLOT_LABELS: Record<GlucoseSlot, string> = {
  before_breakfast: "Antes del desayuno",
  after_breakfast: "Despues del desayuno",
  before_lunch: "Antes del almuerzo",
  after_lunch: "Despues del almuerzo",
  before_dinner: "Antes de la cena",
  after_dinner: "Despues de la cena",
}

type GlucoseStatus = "critical_low" | "low" | "normal" | "high" | "critical_high"

function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < GLUCOSE_RANGES.critical_low) return "critical_low"
  if (value < GLUCOSE_RANGES.low) return "low"
  if (value <= GLUCOSE_RANGES.high) return "normal"
  if (value <= GLUCOSE_RANGES.critical_high) return "high"
  return "critical_high"
}

// ============================================================================
// GlucoseDialog Component
// ============================================================================

export function GlucoseDialog() {
  const { state, isOpen, closeDialog } = useGlucoseDialog()
  const { createRecord, updateRecord, deleteRecord, isPending } =
    useGlucoseMutations()

  const [value, setValue] = useState<string>("")
  const [slot, setSlot] = useState<GlucoseSlot | undefined>(undefined)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEditing = state.mode === "edit"
  const initialRecord = state.record

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(initialRecord?.value?.toString() || "")
      setSlot(initialRecord?.slot as GlucoseSlot | undefined)
      setNotes(initialRecord?.notes || "")
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialRecord])

  const numericValue = parseInt(value, 10)
  const isValid =
    !isNaN(numericValue) && numericValue >= 20 && numericValue <= 600
  const status = isValid ? getGlucoseStatus(numericValue) : null

  const handleSubmit = () => {
    if (!value.trim()) {
      setError("Ingresa un valor")
      return
    }
    if (!isValid) {
      setError("El valor debe estar entre 20 y 600 mg/dL")
      return
    }

    if (isEditing && initialRecord) {
      updateRecord(
        initialRecord._id as Id<"glucoseRecords">,
        numericValue,
        slot,
        notes.trim() || undefined
      )
    } else {
      createRecord(numericValue, slot, notes.trim() || undefined)
    }
    closeDialog()
  }

  const handleDelete = () => {
    if (initialRecord) {
      deleteRecord(initialRecord._id as Id<"glucoseRecords">)
      closeDialog()
    }
  }

  const statusColors: Record<GlucoseStatus, string> = {
    critical_low: "text-destructive border-destructive/50",
    low: "text-warning border-warning/50",
    normal: "text-success border-success/50",
    high: "text-warning border-warning/50",
    critical_high: "text-destructive border-destructive/50",
  }

  const statusMessages: Record<GlucoseStatus, string> = {
    critical_low: "Hipoglucemia severa - Busca atencion",
    low: "Glucosa baja",
    normal: "En rango normal",
    high: "Glucosa elevada",
    critical_high: "Hiperglucemia severa",
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Droplets className="w-5 h-5 text-primary" />
            {isEditing ? "Editar registro" : "Nuevo registro"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="glucose-value" className="text-muted-foreground">
              Valor de glucosa
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="glucose-value"
                type="number"
                inputMode="numeric"
                placeholder="120"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(null)
                }}
                className={cn(
                  "text-2xl font-bold text-center h-16 pr-16",
                  isValid && status ? statusColors[status] : "",
                  error ? "border-destructive" : ""
                )}
                min={20}
                max={600}
                disabled={isPending}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                mg/dL
              </span>
            </div>

            {isValid && status && (
              <div
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg",
                  status === "normal" ? "bg-success/10" : "bg-warning/10"
                )}
              >
                {status === "normal" ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    status === "normal" ? "text-success" : "text-warning"
                  )}
                >
                  {statusMessages[status]}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="glucose-slot" className="text-muted-foreground">
              Momento del dia (opcional)
            </Label>
            <Select
              value={slot || ""}
              onValueChange={(val) =>
                setSlot((val as GlucoseSlot) || undefined)
              }
              disabled={isPending}
            >
              <SelectTrigger id="glucose-slot" className="w-full">
                <SelectValue placeholder="Selecciona un momento" />
              </SelectTrigger>
              <SelectContent>
                {GLUCOSE_SLOTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {GLUCOSE_SLOT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="glucose-notes" className="text-muted-foreground">
              Nota (opcional)
            </Label>
            <Textarea
              id="glucose-notes"
              placeholder="Ej: despues de ejercicio, me senti mareado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-16"
              maxLength={200}
              disabled={isPending}
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
            <p>Rangos de referencia:</p>
            <ul className="grid grid-cols-2 gap-1">
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span>&lt;{GLUCOSE_RANGES.low} Bajo</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>
                  {GLUCOSE_RANGES.low}-{GLUCOSE_RANGES.high} Normal
                </span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1 sm:flex-none mr-auto"
              disabled={isPending}
            >
              Eliminar
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || isPending}
            className="flex-1 sm:flex-none"
          >
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

