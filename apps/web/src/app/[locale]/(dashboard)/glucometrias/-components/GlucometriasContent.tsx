"use client"

import { useTranslations, useLocale } from "next-intl"
import { useState, useMemo } from "react"
import {
  useGlucoseRecords,
  useGlucoseMutations,
  GlucoseRecordCard,
  type ViewMode,
  type GlucoseSlot,
  type GlucoseRecord,
} from "@/features/glucose"
import { GlucometriasHeader } from "./GlucometriasHeader"
import { AddGlucoseDialog } from "./AddGlucoseDialog"
import { ViewModeSelector } from "./ViewModeSelector"
import { WeeklyView } from "./WeeklyView"
import { MonthlyView } from "./MonthlyView"
import { QuarterlyView } from "./QuarterlyView"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  format,
  isSameDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  addDays,
  subDays,
} from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarIcon,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Droplets,
} from "lucide-react"

export function GlucometriasContent() {
  const t = useTranslations("Glucometrias")
  const locale = useLocale()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("daily")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<GlucoseRecord | undefined>(
    undefined
  )

  // Get glucose records and mutations
  const { getRecordsByDate, getRecordsInRange } = useGlucoseRecords()
  const { createRecord, updateRecord, deleteRecord } = useGlucoseMutations()

  // Calculate date range based on view mode
  const { startDate, endDate } = useMemo(() => {
    switch (viewMode) {
      case "daily":
        return { startDate: selectedDate, endDate: selectedDate }
      case "weekly":
        return {
          startDate: startOfWeek(selectedDate, { weekStartsOn: 1 }),
          endDate: endOfWeek(selectedDate, { weekStartsOn: 1 }),
        }
      case "monthly":
        return {
          startDate: startOfMonth(selectedDate),
          endDate: endOfMonth(selectedDate),
        }
      case "quarterly":
        return {
          startDate: startOfQuarter(selectedDate),
          endDate: endOfQuarter(selectedDate),
        }
    }
  }, [viewMode, selectedDate])

  // Get records for the selected period (Convex types - views now support both)
  const periodRecords = useMemo(() => {
    return viewMode === "daily"
      ? getRecordsByDate(selectedDate)
      : getRecordsInRange(startDate, endDate)
  }, [viewMode, selectedDate, startDate, endDate, getRecordsByDate, getRecordsInRange])

  // Get records for selected date (for daily view) - using Convex types directly
  const dayRecords = useMemo(() => {
    return getRecordsByDate(selectedDate)
  }, [selectedDate, getRecordsByDate])

  const isToday = isSameDay(selectedDate, new Date())

  // Dialog handlers
  const handleOpenAddDialog = () => {
    setSelectedRecord(undefined)
    setDialogOpen(true)
  }

  const handleEditRecord = (record: GlucoseRecord) => {
    setSelectedRecord(record)
    setDialogOpen(true)
  }

  const handleDeleteRecord = (id: GlucoseRecord["_id"]) => {
    deleteRecord(id)
  }

  const handleSaveRecord = (value: number, slot?: GlucoseSlot, notes?: string) => {
    if (selectedRecord) {
      updateRecord(selectedRecord._id, value, slot, notes)
    } else {
      createRecord(value, slot, notes)
    }
  }

  const handleDeleteFromDialog = (id: string) => {
    deleteRecord(id as GlucoseRecord["_id"])
  }

  // Calculate daily stats (for daily view)
  const stats = useMemo(() => {
    if (dayRecords.length === 0) return null

    const values = dayRecords.map((r) => r.value)
    return {
      count: values.length,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      inRange: values.filter((v) => v >= 70 && v <= 180).length,
    }
  }, [dayRecords])

  // Date navigation for daily view
  const handlePrevDay = () => {
    setSelectedDate(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    const nextDay = addDays(selectedDate, 1)
    if (nextDay <= new Date()) {
      setSelectedDate(nextDay)
    }
  }

  return (
    <>
      <GlucometriasHeader viewMode={viewMode} />

      {/* View Mode Selector */}
      <div className="mb-4 flex justify-center">
        <ViewModeSelector value={viewMode} onChange={setViewMode} />
      </div>

      {/* Date Picker (only for daily view) */}
      {viewMode === "daily" && (
        <div className="mb-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevDay}
            aria-label={t("navigation.previousDay")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="outline"
            className={cn(
              "justify-center text-left font-normal h-12 px-4 min-w-[200px]"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="capitalize">
              {format(
                selectedDate,
                locale === "es" ? "EEEE, d 'de' MMMM" : "EEEE, d MMMM",
                { locale: locale === "es" ? es : undefined }
              )}
            </span>
            {isToday && (
              <span className="ml-2 text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                {t("periodLabels.today")}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            disabled={isToday}
            aria-label={t("navigation.nextDay")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Daily View - EDITABLE */}
      {viewMode === "daily" && (
        <>
          {/* Daily Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">{t("dailyView.records")}</span>
                </div>
                <p className="text-xl font-bold text-foreground">{stats.count}</p>
              </article>
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-info" />
                  <span className="text-xs text-muted-foreground">{t("dailyView.average")}</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.avg}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    mg/dL
                  </span>
                </p>
              </article>
              <article className="glass-card p-4">
                <span className="text-xs text-muted-foreground">{t("dailyView.minimum")}</span>
                <p className="text-xl font-bold text-warning">
                  {stats.min}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    mg/dL
                  </span>
                </p>
              </article>
              <article className="glass-card p-4">
                <span className="text-xs text-muted-foreground">{t("dailyView.maximum")}</span>
                <p className="text-xl font-bold text-destructive">
                  {stats.max}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    mg/dL
                  </span>
                </p>
              </article>
            </div>
          )}

          <section className="space-y-3 pb-24">
            <h2 className="text-base font-semibold text-foreground mb-4">
              {t("dailyView.recordsTitle")}
            </h2>

            {dayRecords.map((record, index) => (
              <div
                key={record._id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <GlucoseRecordCard
                  record={record}
                  onEdit={handleEditRecord}
                  onDelete={handleDeleteRecord}
                />
              </div>
            ))}

            {dayRecords.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center mb-4">
                  <Droplets className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">
                  {t("dailyView.noRecordsToday")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isToday
                    ? t("dailyView.tapToAddFirst")
                    : t("dailyView.noRecordsForDate")}
                </p>
              </div>
            )}
          </section>

          {/* Floating Action Button */}
          {isToday && (
            <Button
              onClick={handleOpenAddDialog}
              className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-lg btn-neon z-50"
              size="icon"
              aria-label={t("dailyView.addRecordAria")}
            >
              <Plus className="w-6 h-6" />
            </Button>
          )}
        </>
      )}

      {/* Weekly View - READ ONLY */}
      {viewMode === "weekly" && (
        <WeeklyView
          records={periodRecords}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Monthly View - READ ONLY */}
      {viewMode === "monthly" && (
        <MonthlyView
          records={periodRecords}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Quarterly View - READ ONLY */}
      {viewMode === "quarterly" && (
        <QuarterlyView
          records={periodRecords}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Add/Edit Dialog */}
      <AddGlucoseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialRecord={selectedRecord}
        onSave={handleSaveRecord}
        onDelete={handleDeleteFromDialog}
      />
    </>
  )
}

