"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Syringe, Calendar, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface InsulinLogDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insulinType: "rapid" | "basal"
  defaultDose: number
  onConfirm: (data: { dose: number; administeredAt: Date }) => void
  isLoading?: boolean
}

export function InsulinLogDialog({
  open,
  onOpenChange,
  insulinType,
  defaultDose,
  onConfirm,
  isLoading = false,
}: InsulinLogDialogProps) {
  const [dose, setDose] = useState(defaultDose)
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date()
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    return format(now, "yyyy-MM-dd'T'HH:mm")
  })

  // Reset values when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setDose(defaultDose)
      setDateTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    }
    onOpenChange(newOpen)
  }

  const handleConfirm = () => {
    const administeredAt = new Date(dateTime)
    onConfirm({ dose, administeredAt })
  }

  const typeLabel = insulinType === "rapid" ? "Rapida" : "Basal"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            Registrar dosis
          </DialogTitle>
          <DialogDescription>
            Confirma los datos de tu aplicacion de insulina
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Insulin type badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tipo:</span>
            <Badge variant={insulinType === "rapid" ? "default" : "secondary"}>
              {typeLabel}
            </Badge>
          </div>

          {/* Dose input */}
          <div className="space-y-2">
            <Label htmlFor="dose" className="flex items-center gap-2">
              <Syringe className="h-4 w-4" />
              Dosis (unidades)
            </Label>
            <Input
              id="dose"
              type="number"
              min={1}
              max={100}
              value={dose}
              onChange={(e) => setDose(Number(e.target.value))}
              className="h-12 text-lg font-medium"
              disabled={isLoading}
            />
          </div>

          {/* DateTime input */}
          <div className="space-y-2">
            <Label htmlFor="datetime" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha y hora
            </Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="h-12"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Por defecto: hora actual
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading || dose <= 0}>
            {isLoading ? "Guardando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

