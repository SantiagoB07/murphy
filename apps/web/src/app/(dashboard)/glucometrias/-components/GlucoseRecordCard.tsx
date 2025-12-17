"use client"

import type { Glucometry } from "@/types/diabetes"
import { getGlucoseStatus } from "@/types/diabetes"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GlucoseRecordCardProps {
  record: Glucometry
  onEdit: (record: Glucometry) => void
  onDelete: (record: Glucometry) => void
}

const statusColors = {
  critical_low: "text-destructive",
  low: "text-warning",
  normal: "text-success",
  high: "text-warning",
  critical_high: "text-destructive",
}

const statusBgColors = {
  critical_low: "bg-destructive/20 border-destructive/30",
  low: "bg-warning/20 border-warning/30",
  normal: "bg-success/20 border-success/30",
  high: "bg-warning/20 border-warning/30",
  critical_high: "bg-destructive/20 border-destructive/30",
}

const statusLabels = {
  critical_low: "Muy bajo",
  low: "Bajo",
  normal: "Normal",
  high: "Alto",
  critical_high: "Muy alto",
}

export function GlucoseRecordCard({
  record,
  onEdit,
  onDelete,
}: GlucoseRecordCardProps) {
  const status = getGlucoseStatus(record.value)
  const time = format(parseISO(record.timestamp), "HH:mm", { locale: es })

  return (
    <article
      className={cn(
        "glass-card p-4 border transition-all",
        statusBgColors[status]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Time and value */}
        <div className="flex items-center gap-4">
          {/* Time badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/50">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{time}</span>
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-1">
            <span className={cn("text-2xl font-bold", statusColors[status])}>
              {record.value}
            </span>
            <span className="text-sm text-muted-foreground">mg/dL</span>
          </div>

          {/* Status label */}
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              statusBgColors[status],
              statusColors[status]
            )}
          >
            {statusLabels[status]}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(record)}
            aria-label="Editar registro"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(record)}
            aria-label="Eliminar registro"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notes (if any) */}
      {record.notes && (
        <p className="mt-2 text-sm text-muted-foreground pl-1 border-l-2 border-border/50 ml-1">
          {record.notes}
        </p>
      )}
    </article>
  )
}
