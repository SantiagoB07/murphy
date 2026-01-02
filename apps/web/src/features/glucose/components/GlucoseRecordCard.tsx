"use client"

import { useTranslations, useLocale } from "next-intl"
import type { Doc, Id } from "@murphy/backend/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Clock, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GlucoseSlot, GlucoseStatus } from "../glucose.types"

// ============================================================================
// Types
// ============================================================================

interface GlucoseRecordCardProps {
  record: Doc<"glucoseRecords">
  onEdit?: (record: Doc<"glucoseRecords">) => void
  onDelete?: (id: Id<"glucoseRecords">) => void
}

// ============================================================================
// Constants
// ============================================================================

const GLUCOSE_RANGES = {
  critical_low: 54,
  low: 70,
  high: 180,
  critical_high: 250,
}

const statusColors: Record<GlucoseStatus, string> = {
  critical_low: "text-destructive",
  low: "text-warning",
  normal: "text-success",
  high: "text-warning",
  critical_high: "text-destructive",
}

const statusBgColors: Record<GlucoseStatus, string> = {
  critical_low: "bg-destructive/20 border-destructive/30",
  low: "bg-warning/20 border-warning/30",
  normal: "bg-success/20 border-success/30",
  high: "bg-warning/20 border-warning/30",
  critical_high: "bg-destructive/20 border-destructive/30",
}

// ============================================================================
// Helpers
// ============================================================================

function getGlucoseStatus(value: number): GlucoseStatus {
  if (value < GLUCOSE_RANGES.critical_low) return "critical_low"
  if (value < GLUCOSE_RANGES.low) return "low"
  if (value <= GLUCOSE_RANGES.high) return "normal"
  if (value <= GLUCOSE_RANGES.critical_high) return "high"
  return "critical_high"
}

// ============================================================================
// Component
// ============================================================================

export function GlucoseRecordCard({
  record,
  onEdit,
  onDelete,
}: GlucoseRecordCardProps) {
  const t = useTranslations("Glucometrias")
  const locale = useLocale()
  const status = getGlucoseStatus(record.value)
  const time = format(new Date(record.recordedAt), "HH:mm", { locale: locale === "es" ? es : undefined })
  const statusLabels: Record<GlucoseStatus, string> = {
    critical_low: t("statusLabels.critical_low"),
    low: t("statusLabels.low"),
    normal: t("statusLabels.normal"),
    high: t("statusLabels.high"),
    critical_high: t("statusLabels.critical_high"),
  }

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
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(record)}
              aria-label={t("card.editRecord")}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(record._id)}
              aria-label={t("card.deleteRecord")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Slot label (if any) */}
      {record.slot && (
        <p className="mt-2 text-sm text-muted-foreground pl-1 border-l-2 border-border/50 ml-1">
          {t(`slots.${record.slot}`)}
        </p>
      )}
    </article>
  )
}

