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
import {
  getGlucoseStatus,
  GLUCOSE_RANGES,
  GLUCOSE_SLOTS,
  GLUCOSE_SLOT_LABELS,
} from "@/types/diabetes"
import type { Glucometry, GlucoseSlot } from "@/types/diabetes"

interface AddGlucoseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRecord?: Glucometry // For editing existing record
  onSave: (value: number, slot?: GlucoseSlot, notes?: string) => void
  onDelete?: (id: string) => void // For deleting existing record
}

export function AddGlucoseDialog({
  open,
  onOpenChange,
  initialRecord,
  onSave,
  onDelete,
}: AddGlucoseDialogProps) {
  const [value, setValue] = useState<string>("")
  const [slot, setSlot] = useState<GlucoseSlot | undefined>(undefined)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!initialRecord

  useEffect(() => {
    if (open) {
      setValue(initialRecord?.value?.toString() || "")
      setSlot(initialRecord?.slot)
      setNotes(initialRecord?.notes || "")
      setError(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, initialRecord])

  const numericValue = parseInt(value, 10)
  const isValid = !isNaN(numericValue) && numericValue >= 20 && numericValue <= 600
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
    onSave(numericValue, slot, notes.trim() || undefined)
    onOpenChange(false)
  }

  const handleDelete = () => {
    if (initialRecord && onDelete) {
      onDelete(initialRecord.id)
      onOpenChange(false)
    }
  }

  const statusColors = {
    critical_low: "text-destructive border-destructive/50",
    low: "text-warning border-warning/50",
    normal: "text-success border-success/50",
    high: "text-warning border-warning/50",
    critical_high: "text-destructive border-destructive/50",
  }

  const statusMessages = {
    critical_low: "Hipoglucemia severa - Busca atencion",
    low: "Glucosa baja",
    normal: "En rango normal",
    high: "Glucosa elevada",
    critical_high: "Hiperglucemia severa",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onValueChange={(val) => setSlot(val as GlucoseSlot || undefined)}
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
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1 sm:flex-none mr-auto"
            >
              Eliminar
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="flex-1 sm:flex-none"
          >
            {isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
