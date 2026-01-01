"use client"

import { useTranslations } from "next-intl"
import { Activity, TrendingUp, Calendar, Target, BarChart3 } from "lucide-react"

export interface PeriodStats {
  count: number
  avg: number
  min: number
  max: number
  inRangeCount: number
  inRangePercent: number
  totalDays: number
  daysWithRecords: number
  daysWithRecordsPercent: number
  avgTakesPerDay: number
  stdDev: number
}

interface PeriodStatsCardProps {
  stats: PeriodStats
  periodLabel: string
}

export function PeriodStatsCard({ stats, periodLabel }: PeriodStatsCardProps) {
  const t = useTranslations("Glucometrias.periodStats")
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t("measurements")}</span>
          </div>
          <p className="text-xl font-bold text-foreground">{stats.count}</p>
          <p className="text-xs text-muted-foreground">
            {stats.avgTakesPerDay} {t("takesPerDay")}
          </p>
        </article>

        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-info" />
            <span className="text-xs text-muted-foreground">{t("average")}</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.avg}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              mg/dL
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            ±{stats.stdDev} {t("deviation")}
          </p>
        </article>

        <article className="glass-card p-4">
          <span className="text-xs text-muted-foreground">{t("minimum")}</span>
          <p className="text-xl font-bold text-warning">
            {stats.min}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              mg/dL
            </span>
          </p>
        </article>

        <article className="glass-card p-4">
          <span className="text-xs text-muted-foreground">{t("maximum")}</span>
          <p className="text-xl font-bold text-destructive">
            {stats.max}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              mg/dL
            </span>
          </p>
        </article>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">{t("inRange")}</span>
          </div>
          <p className="text-xl font-bold text-success">{stats.inRangePercent}%</p>
          <p className="text-xs text-muted-foreground">
            {stats.inRangeCount} {t("of")} {stats.count} {t("measurements").toLowerCase()}
          </p>
        </article>

        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{t("daysWithRecords")}</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.daysWithRecordsPercent}%
          </p>
          <p className="text-xs text-muted-foreground">
            {stats.daysWithRecords} {t("of")} {stats.totalDays} dias
          </p>
        </article>

        <article className="glass-card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-info" />
            <span className="text-xs text-muted-foreground">{t("period")}</span>
          </div>
          <p className="text-base font-semibold text-foreground truncate">
            {periodLabel}
          </p>
        </article>
      </div>
    </div>
  )
}
