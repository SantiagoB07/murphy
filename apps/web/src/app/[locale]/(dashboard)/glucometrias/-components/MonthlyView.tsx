"use client"

import { useTranslations, useLocale } from "next-intl"
import { useMemo } from "react"
import {
  calculatePeriodStats,
  GlucoseChart,
  getGlucoseStatus,
} from "@/features/glucose"
import type { GlucoseRecordLike } from "@/features/glucose/adapters"
import { getRecordDate, toChartFormat } from "@/features/glucose/adapters"
import { PeriodStatsCard } from "./PeriodStatsCard"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getWeek,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MonthlyViewProps {
  records: GlucoseRecordLike[]
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function MonthlyView({
  records,
  selectedDate,
  onDateChange,
}: MonthlyViewProps) {
  const t = useTranslations("Glucometrias")
  const locale = useLocale()
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)

  const stats = useMemo(() => {
    return calculatePeriodStats(records, monthStart, monthEnd)
  }, [records, monthStart, monthEnd])

  const monthDays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [monthStart, monthEnd])

  // Get records summary per day for calendar
  const dailySummary = useMemo(() => {
    return monthDays.map((day) => {
      const dayRecords = records.filter((r) =>
        isSameDay(getRecordDate(r), day)
      )
      const avg =
        dayRecords.length > 0
          ? Math.round(
              dayRecords.reduce((sum, r) => sum + r.value, 0) / dayRecords.length
            )
          : null
      return {
        date: day,
        count: dayRecords.length,
        avg,
        status: avg ? getGlucoseStatus(avg) : null,
      }
    })
  }, [monthDays, records])

  // Week summaries
  const weekSummaries = useMemo(() => {
    const weeks: Array<{
      weekNum: number
      start: Date
      end: Date
      count: number
      avg: number | null
    }> = []

    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })

    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
      const weekRecords = records.filter((r) => {
        const date = getRecordDate(r)
        return isWithinInterval(date, {
          start: currentWeekStart,
          end: currentWeekEnd,
        })
      })

      weeks.push({
        weekNum: getWeek(currentWeekStart, { weekStartsOn: 1 }),
        start: currentWeekStart,
        end: currentWeekEnd,
        count: weekRecords.length,
        avg:
          weekRecords.length > 0
            ? Math.round(
                weekRecords.reduce((sum, r) => sum + r.value, 0) /
                  weekRecords.length
              )
            : null,
      })

      currentWeekStart = new Date(currentWeekStart)
      currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }

    return weeks
  }, [monthStart, monthEnd, records])

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() - 1)
    onDateChange(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate)
    newDate.setMonth(newDate.getMonth() + 1)
    if (newDate <= new Date()) {
      onDateChange(newDate)
    }
  }

  const isCurrentMonth =
    monthStart.getMonth() === new Date().getMonth() &&
    monthStart.getFullYear() === new Date().getFullYear()

  const periodLabel = format(selectedDate, "MMMM yyyy", { locale: locale === "es" ? es : undefined })

  const weekDaysHeader = t.raw("monthlyView.weekDays") as string[]

  const statusColors: Record<string, string> = {
    critical_low: "bg-destructive",
    low: "bg-warning",
    normal: "bg-success",
    high: "bg-warning",
    critical_high: "bg-destructive",
  }

  // Calculate padding for first week
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7 // Monday = 0

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          aria-label={t("navigation.previousMonth")}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="text-center">
          <p className="text-lg font-semibold text-foreground capitalize">
            {periodLabel}
          </p>
          {isCurrentMonth && (
            <span className="text-xs text-primary">{t("periodLabels.thisMonth")}</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
          aria-label={t("navigation.nextMonth")}
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

      {/* Calendar View */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {t("monthlyView.calendar")}
        </h3>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDaysHeader.map((day, i) => (
            <div
              key={i}
              className="text-center text-xs text-muted-foreground font-medium py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for padding */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {dailySummary.map((day, index) => (
            <div
              key={index}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-center p-1",
                day.count > 0 ? "bg-primary/10" : "bg-muted/10",
                isSameDay(day.date, new Date()) && "ring-2 ring-primary"
              )}
            >
              <span className="text-xs font-medium text-foreground">
                {format(day.date, "d")}
              </span>
              {day.count > 0 && (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full mt-0.5",
                    day.status ? statusColors[day.status] : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">{t("monthlyView.legend.inRange")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">{t("monthlyView.legend.lowHigh")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">{t("monthlyView.legend.critical")}</span>
          </div>
        </div>
      </div>

      {/* Week Summaries */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          {t("monthlyView.summaryByWeek")}
        </h3>
        <div className="space-y-2">
          {weekSummaries.map((week, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/10"
            >
              <span className="text-sm text-foreground">
                {t("monthlyView.week")} {week.weekNum}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">
                  {week.count} {t("monthlyView.takes")}
                </span>
                {week.avg !== null && (
                  <span className="text-sm font-medium text-foreground">
                    {week.avg} mg/dL
                  </span>
                )}
              </div>
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
          <p className="text-foreground font-medium">{t("emptyStates.noRecordsMonth")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("emptyStates.noRecordsPeriod")}
          </p>
        </div>
      )}
    </div>
  )
}
