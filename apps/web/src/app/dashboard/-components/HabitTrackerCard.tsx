"use client"

import {
  Moon,
  Brain,
  Sparkles,
  Calendar,
  ChevronRight,
  History,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { STRESS_LEVEL_LABELS } from "@/types/diabetes"

interface WellnessItem {
  id: string
  label: string
  icon: LucideIcon
  color: string
  bgColor: string
  value?: string
  status?: "pending" | "recorded"
}

interface HabitTrackerCardProps {
  date?: string
  sleepData?: { hours: number; quality: number } | null
  stressData?: { level: number } | null
  dizzinessData?: { experienced: boolean; severity?: number } | null
  onSleepClick: () => void
  onStressClick: () => void
  onDizzinessClick: () => void
  onViewHistory?: (type: "sleep" | "stress" | "dizziness") => void
}

const getDizzinessDisplayValue = (
  data: { experienced: boolean; severity?: number } | null | undefined
): string | undefined => {
  if (!data) return undefined
  if (!data.experienced) return "Sin mareos hoy"
  return data.severity ? `Intensidad ${data.severity}/10` : "Mareos registrados"
}

export function HabitTrackerCard({
  date = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }),
  sleepData,
  stressData,
  dizzinessData,
  onSleepClick,
  onStressClick,
  onDizzinessClick,
  onViewHistory,
}: HabitTrackerCardProps) {
  // Build wellness items with current data
  const wellnessItems: WellnessItem[] = [
    {
      id: "sleep",
      label: "Registro de sueño",
      icon: Moon,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/20",
      value: sleepData
        ? `${sleepData.hours}h · Calidad ${sleepData.quality}/10`
        : undefined,
      status: sleepData ? "recorded" : "pending",
    },
    {
      id: "stress",
      label: "Nivel de estrés",
      icon: Brain,
      color: "text-rose-400",
      bgColor: "bg-rose-500/20",
      value: stressData ? STRESS_LEVEL_LABELS[stressData.level] : undefined,
      status: stressData ? "recorded" : "pending",
    },
    {
      id: "dizziness",
      label: "Registro de mareos",
      icon: Sparkles,
      color: "text-pink-400",
      bgColor: "bg-pink-500/20",
      value: getDizzinessDisplayValue(dizzinessData),
      status: dizzinessData ? "recorded" : "pending",
    },
  ]

  const recordedCount = wellnessItems.filter(
    (item) => item.status === "recorded"
  ).length

  const handleItemClick = (id: string) => {
    switch (id) {
      case "sleep":
        onSleepClick()
        break
      case "stress":
        onStressClick()
        break
      case "dizziness":
        onDizzinessClick()
        break
    }
  }

  return (
    <section
      className="glass-card overflow-hidden animate-fade-up"
      aria-labelledby="wellness-tracker-title"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3
              id="wellness-tracker-title"
              className="font-semibold text-lg text-foreground leading-tight"
            >
              Bienestar Diario
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar
                className="w-4 h-4 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-sm text-muted-foreground capitalize">
                {date}
              </span>
            </div>
          </div>
          <div
            className="text-right"
            aria-label={`${recordedCount} de ${wellnessItems.length} registrados`}
          >
            <p className="text-2xl font-bold text-foreground leading-tight">
              {recordedCount}/{wellnessItems.length}
            </p>
            <p className="text-xs text-muted-foreground">registrados</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1.5">
          {wellnessItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex-1 h-1.5 rounded-full transition-colors",
                item.status === "recorded" ? "bg-success" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Wellness Items Grid - Responsive */}
      <div
        className="p-5 grid grid-cols-1 md:grid-cols-3 gap-3"
        role="list"
        aria-label="Lista de bienestar"
      >
        {wellnessItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => handleItemClick(item.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  handleItemClick(item.id)
                }
              }}
              className={cn(
                "flex md:flex-col items-center gap-3 md:gap-2 p-4 rounded-xl cursor-pointer",
                "transition-all duration-150 ease-out",
                "hover:bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-95",
                "min-h-[44px]",
                item.status === "recorded"
                  ? "bg-secondary/30 border border-border/50"
                  : "bg-secondary/10 border border-transparent"
              )}
              style={{ animationDelay: `${index * 0.03}s` }}
              aria-label={`${item.label}: ${item.value || "Sin registrar"}`}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0",
                  "transition-shadow duration-150",
                  item.bgColor,
                  item.status === "recorded" && "shadow-md"
                )}
              >
                <Icon
                  className={cn("w-6 h-6 md:w-7 md:h-7", item.color)}
                  aria-hidden="true"
                />
              </div>

              {/* Label & Value */}
              <div className="flex-1 min-w-0 text-left md:text-center">
                <p
                  className={cn(
                    "font-medium text-sm transition-colors duration-150",
                    item.status === "recorded"
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    item.status === "recorded"
                      ? "text-muted-foreground"
                      : "text-muted-foreground/60"
                  )}
                >
                  {item.value || "Toca para registrar"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {onViewHistory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewHistory(item.id as "sleep" | "stress" | "dizziness")
                    }}
                    className="p-2 rounded-xl hover:bg-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={`Ver historial de ${item.label}`}
                  >
                    <History
                      className="w-4 h-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </button>
                )}
                <ChevronRight
                  className="w-5 h-5 text-muted-foreground/50 md:hidden"
                  aria-hidden="true"
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
