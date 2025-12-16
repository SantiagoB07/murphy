"use client"

import { Zap, Moon, Brain, TrendingUp, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DailyXPResult } from "@/hooks/useXPCalculation"

interface DailyXPSummaryProps {
  xpResult: DailyXPResult
  className?: string
}

export function DailyXPSummary({ xpResult, className }: DailyXPSummaryProps) {
  const {
    finalXP,
    baseXP,
    breakdown,
    streakDays,
    streakMultiplier,
    slotsCompleted,
    totalSlots,
    minRequiredSlots,
    inRangePercent,
    hasSleepLogged,
    hasStressLogged,
    maxDailyXP,
  } = xpResult

  const progressPercent = Math.min(
    100,
    (finalXP / (maxDailyXP * streakMultiplier)) * 100
  )
  const hasMinSlots = slotsCompleted >= minRequiredSlots

  return (
    <section className={cn("glass-card p-4 space-y-4", className)}>
      {/* Header with XP */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">XP de hoy</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">
                +{finalXP}
              </span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
          </div>
        </div>

        {/* Streak multiplier badge */}
        {streakDays > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-warning/20 border border-warning/30">
            <span className="text-sm">*</span>
            <span className="text-xs font-medium text-warning">
              x{streakMultiplier.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Progreso diario</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-purple rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Breakdown grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Slots */}
        <div
          className={cn(
            "p-3 rounded-xl",
            hasMinSlots
              ? "bg-success/10 border border-success/20"
              : "bg-muted/30"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp
              className={cn(
                "w-4 h-4",
                hasMinSlots ? "text-success" : "text-muted-foreground"
              )}
            />
            <span className="text-xs text-muted-foreground">Slots</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-lg font-semibold",
                hasMinSlots ? "text-success" : "text-foreground"
              )}
            >
              {slotsCompleted}/{totalSlots}
            </span>
            <span className="text-xs text-muted-foreground">
              +{breakdown.slotsXP} XP
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Min. {minRequiredSlots} {hasMinSlots && "OK"}
          </p>
        </div>

        {/* In Range */}
        <div
          className={cn(
            "p-3 rounded-xl",
            inRangePercent >= 70
              ? "bg-success/10 border border-success/20"
              : "bg-muted/30"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                inRangePercent >= 70 ? "bg-success/20" : "bg-muted/50"
              )}
            >
              <span className="text-[10px]">#</span>
            </div>
            <span className="text-xs text-muted-foreground">En rango</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-lg font-semibold",
                inRangePercent >= 70 ? "text-success" : "text-foreground"
              )}
            >
              {Math.round(inRangePercent)}%
            </span>
            <span className="text-xs text-muted-foreground">
              +{breakdown.inRangeXP} XP
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">70-180 mg/dL</p>
        </div>
      </div>

      {/* Wellness status */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">Bienestar:</span>

        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              hasSleepLogged
                ? "bg-success/20 text-success"
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            {hasSleepLogged ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <Moon className="w-3 h-3" />
            <span>Sueno</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              hasStressLogged
                ? "bg-success/20 text-success"
                : "bg-muted/30 text-muted-foreground"
            )}
          >
            {hasStressLogged ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            <Brain className="w-3 h-3" />
            <span>Estres</span>
          </div>
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          +{breakdown.wellnessXP} XP
        </span>
      </div>

      {/* Base vs Final XP (if streak active) */}
      {streakDays > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Base: {baseXP} XP</span>
          <span>
            Racha {streakDays}d: x{streakMultiplier.toFixed(2)}
          </span>
          <span className="text-purple-400 font-medium">= {finalXP} XP</span>
        </div>
      )}
    </section>
  )
}
