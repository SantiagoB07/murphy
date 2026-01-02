"use client"

import { useTranslations, useLocale } from "next-intl"
import { useMemo } from "react"
import {
  calculatePeriodStats,
  GlucoseChart,
} from "@/features/glucose"
import type { GlucoseRecordLike } from "@/features/glucose/adapters"
import { getRecordDate, toChartFormat } from "@/features/glucose/adapters"
import { PeriodStatsCard } from "./PeriodStatsCard"
import {
  format,
  startOfQuarter,
  endOfQuarter,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isWithinInterval,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuarterlyViewProps {
  records: GlucoseRecordLike[]
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function QuarterlyView({
  records,
  selectedDate,
  onDateChange,
}: QuarterlyViewProps) {
  const t = useTranslations("Glucometrias")
  const locale = useLocale()
  const quarterStart = startOfQuarter(selectedDate)
  const quarterEnd = endOfQuarter(selectedDate)

  const stats = useMemo(() => {
    return calculatePeriodStats(records, quarterStart, quarterEnd)
  }, [records, quarterStart, quarterEnd])

  // Get quarter number (1-4)
  const quarterNumber = Math.floor(quarterStart.getMonth() / 3) + 1

  // Monthly breakdowns
  const monthSummaries = useMemo(() => {
    const months = eachMonthOfInterval({ start: quarterStart, end: quarterEnd })

    return months.map((monthDate) => {
      const monthStartDate = startOfMonth(monthDate)
      const monthEndDate = endOfMonth(monthDate)

      const monthRecords = records.filter((r) => {
        const date = getRecordDate(r)
        return isWithinInterval(date, {
          start: monthStartDate,
          end: monthEndDate,
        })
      })

      const values = monthRecords.map((r) => r.value)
      const avg =
        values.length > 0
          ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
          : null

      const inRange = values.filter((v) => v >= 70 && v <= 180).length
      const inRangePercent =
        values.length > 0 ? Math.round((inRange / values.length) * 100) : null

      return {
        month: monthDate,
        label: format(monthDate, "MMMM", { locale: locale === "es" ? es : undefined }),
        count: monthRecords.length,
        avg,
        inRangePercent,
      }
    })
  }, [quarterStart, quarterEnd, records])

  // Calculate trend
  const trend = useMemo(() => {
    const monthsWithData = monthSummaries.filter((m) => m.avg !== null)
    if (monthsWithData.length < 2) return "stable"

    const firstAvg = monthsWithData[0].avg!
    const lastAvg = monthsWithData[monthsWithData.length - 1].avg!
    const diff = lastAvg - firstAvg

    if (diff < -10) return "improving"
    if (diff > 10) return "deteriorating"
    return "stable"
  }, [monthSummaries])

  const handlePrevQuarter = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() - 3)
    onDateChange(newDate)
  }

  const handleNextQuarter = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + 3)
    if (newDate <= new Date()) {
      onDateChange(newDate)
    }
  }

  const isCurrentQuarter =
    quarterStart.getTime() === startOfQuarter(new Date()).getTime()

  const periodLabel = `Q${quarterNumber} ${format(selectedDate, "yyyy")}`

  const trendConfig = {
    improving: { icon: TrendingDown, color: "text-success", label: t("quarterlyView.trend.improving") },
    stable: { icon: Minus, color: "text-info", label: t("quarterlyView.trend.stable") },
    deteriorating: {
      icon: TrendingUp,
      color: "text-destructive",
      label: t("quarterlyView.trend.deteriorating"),
    },
  }

  const TrendIcon = trendConfig[trend].icon

  return (
    <div className="space-y-6">
      {/* Quarter Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevQuarter}
          aria-label={t("navigation.previousQuarter")}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">{periodLabel}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {format(quarterStart, "MMMM", { locale: locale === "es" ? es : undefined })} -{" "}
            {format(quarterEnd, "MMMM yyyy", { locale: locale === "es" ? es : undefined })}
          </p>
          {isCurrentQuarter && (
            <span className="text-xs text-primary">{t("periodLabels.thisQuarter")}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextQuarter}
          disabled={isCurrentQuarter}
          aria-label={t("navigation.nextQuarter")}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Trend Chart - Positioned prominently after navigation */}
      {records.length > 0 && (
        <div className="glass-card p-4">
          <GlucoseChart data={records.map(toChartFormat)} showTargetRange className="w-full" />
        </div>
      )}

      {/* Trend Indicator */}
      {stats && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("quarterlyView.quarterTrend")}
              </h3>
              <p
                className={cn(
                  "text-lg font-semibold",
                  trendConfig[trend].color
                )}
              >
                {trendConfig[trend].label}
              </p>
            </div>
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                trend === "improving" && "bg-success/20",
                trend === "stable" && "bg-info/20",
                trend === "deteriorating" && "bg-destructive/20"
              )}
            >
              <TrendIcon
                className={cn("w-6 h-6", trendConfig[trend].color)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Comparison */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">
          {t("quarterlyView.monthlyComparison")}
        </h3>

        <div className="grid grid-cols-3 gap-3">
          {monthSummaries.map((month, i) => (
            <div key={i} className="rounded-lg bg-muted/10 p-3 text-center">
              <p className="text-sm font-medium text-foreground capitalize mb-2">
                {month.label}
              </p>

              {month.avg !== null ? (
                <>
                  <p className="text-xl font-bold text-foreground">
                    {month.avg}
                  </p>
                  <p className="text-xs text-muted-foreground">mg/dL {t("quarterlyView.average")}</p>

                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-sm font-medium text-success">
                      {month.inRangePercent}% {t("periodStats.inRangeShort")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {month.count} {t("periodStats.measurementsShort")}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">{t("emptyStates.noData")}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <PeriodStatsCard stats={stats} periodLabel={periodLabel} />
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">
            {t("emptyStates.noRecordsQuarter")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("emptyStates.noRecordsPeriod")}
          </p>
        </div>
      )}
    </div>
  )
}
