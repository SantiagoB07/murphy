"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Moon, Brain, Sparkles } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  STRESS_LEVEL_LABELS,
  DIZZINESS_SEVERITY_LABELS,
} from "@/types/diabetes"

interface SleepRecord {
  hours: number
  quality: number
  date?: string
}

interface StressRecord {
  level: number
  notes?: string
  recorded_at?: string
}

interface DizzinessRecord {
  experienced: boolean
  severity?: number
  notes?: string
  recorded_at?: string
}

type WellnessType = "sleep" | "stress" | "dizziness"

interface WellnessHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: WellnessType
  data: SleepRecord[] | StressRecord[] | DizzinessRecord[]
}

const CONFIG = {
  sleep: { icon: Moon, title: "Historial de Sueno", unit: "h", color: "text-indigo-400" },
  stress: { icon: Brain, title: "Historial de Estres", unit: "/10", color: "text-rose-400" },
  dizziness: { icon: Sparkles, title: "Historial de Mareos", unit: "/10", color: "text-pink-400" },
}

export function WellnessHistorySheet({
  open,
  onOpenChange,
  type,
  data,
}: WellnessHistorySheetProps) {
  const { icon: Icon, title, unit, color } = CONFIG[type]

  const getValue = (record: SleepRecord | StressRecord | DizzinessRecord): number | string => {
    if (type === "sleep") {
      return (record as SleepRecord).hours
    }
    if (type === "stress") {
      return (record as StressRecord).level
    }
    const dizzinessRecord = record as DizzinessRecord
    if (!dizzinessRecord.experienced) {
      return "No"
    }
    return dizzinessRecord.severity ?? "-"
  }

  const getDate = (record: SleepRecord | StressRecord | DizzinessRecord): string => {
    if (type === "sleep") {
      return (record as SleepRecord).date ?? new Date().toISOString()
    }
    return (record as StressRecord | DizzinessRecord).recorded_at ?? new Date().toISOString()
  }

  const getLabel = (record: SleepRecord | StressRecord | DizzinessRecord): string | null => {
    if (type === "stress") {
      const level = (record as StressRecord).level
      return STRESS_LEVEL_LABELS[level] ?? null
    }
    if (type === "dizziness") {
      const dizzinessRecord = record as DizzinessRecord
      if (!dizzinessRecord.experienced) return null
      return DIZZINESS_SEVERITY_LABELS[dizzinessRecord.severity ?? 0] ?? null
    }
    return null
  }

  const getQualityLabel = (quality: number): string => {
    if (quality <= 3) return "Malo"
    if (quality <= 5) return "Regular"
    if (quality <= 7) return "Bueno"
    return "Excelente"
  }

  // Calculate average only for numeric values
  const numericData = data.filter((r) => {
    if (type === "dizziness") {
      return (r as DizzinessRecord).experienced
    }
    return true
  })

  const average =
    numericData.length > 0
      ? (
          numericData.reduce((sum, r) => {
            const val = getValue(r)
            return sum + (typeof val === "number" ? val : 0)
          }, 0) / numericData.length
        ).toFixed(1)
      : "0"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", color)} />
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="mb-4 p-3 rounded-xl bg-secondary/30 text-center">
          <p className="text-sm text-muted-foreground">Promedio 30 dias</p>
          <p className="text-2xl font-semibold">
            {average}
            {unit}
          </p>
        </div>

        <ScrollArea className="h-[calc(100%-120px)]">
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Sin registros</p>
          ) : (
            <div className="space-y-2">
              {data.map((record, i) => {
                const value = getValue(record)
                const label = getLabel(record)
                const isSleep = type === "sleep"
                const sleepRecord = record as SleepRecord

                return (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl bg-muted/20"
                  >
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(getDate(record)), "dd MMM", { locale: es })}
                    </span>
                    <div className="text-right">
                      <span className="font-medium">
                        {value}
                        {typeof value === "number" ? unit : ""}
                      </span>
                      {label && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({label})
                        </span>
                      )}
                      {isSleep && sleepRecord.quality && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          Calidad: {getQualityLabel(sleepRecord.quality)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
