"use client"

import { useState, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { GlucoseSlotCard } from "@/components/glucose/GlucoseSlotCard"
import { DailyLogInputDialog } from "@/components/daily-log/DailyLogInputDialog"
import { DailyXPSummary } from "@/components/glucose/DailyXPSummary"
import { ViewModeSelector } from "@/components/glucose/ViewModeSelector"
import { WeeklyView } from "@/components/glucose/WeeklyView"
import { MonthlyView } from "@/components/glucose/MonthlyView"
import { QuarterlyView } from "@/components/glucose/QuarterlyView"
import { Button } from "@/components/ui/button"
import { useGlucoseLog } from "@/hooks/useGlucoseLog"
import { useXPCalculation } from "@/hooks/useXPCalculation"
import type { Glucometry, GlucometryType, ViewMode } from "@/types/diabetes"
import { MEAL_TIME_SLOTS } from "@/types/diabetes"
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
  Share2,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import mockData from "@/data/mockPatients.json"

export default function GlucometriasPage() {
  // Get user name from mock data
  const userName = mockData.patients[0]?.name || "Usuario"
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("daily")
  const [selectedSlot, setSelectedSlot] = useState<{
    type: GlucometryType
    record?: Glucometry
  } | null>(null)

  // Mock wellness state (in real app, this would come from a shared context/store)
  const [hasSleepLogged] = useState(false)
  const [hasStressLogged] = useState(false)

  // Initialize hook
  const { records, addRecord, updateRecord, getRecordsByDate, getRecordsInRange } =
    useGlucoseLog()

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

  // Get records for the selected period
  const periodRecords = useMemo(() => {
    if (viewMode === "daily") {
      return Array.from(getRecordsByDate(selectedDate).values())
    }
    return getRecordsInRange(startDate, endDate)
  }, [viewMode, selectedDate, startDate, endDate, getRecordsByDate, getRecordsInRange])

  // Get records for selected date (for daily view)
  const dayRecords = useMemo(() => {
    return getRecordsByDate(selectedDate)
  }, [selectedDate, getRecordsByDate])

  // Get today's records for XP calculation
  const todayRecords = useMemo(() => {
    const today = new Date()
    if (isSameDay(selectedDate, today)) {
      return Array.from(dayRecords.values())
    }
    return Array.from(getRecordsByDate(today).values())
  }, [selectedDate, dayRecords, getRecordsByDate])

  // Calculate XP for today
  const xpResult = useXPCalculation({
    todayGlucoseRecords: todayRecords,
    hasSleepLogged,
    hasStressLogged,
    streakDays: 5, // Mock streak
    totalAccumulatedXP: 1250, // Mock XP
  })

  const isToday = isSameDay(selectedDate, new Date())

  const handleSlotClick = (type: GlucometryType, record?: Glucometry) => {
    setSelectedSlot({ type, record })
  }

  const handleSaveRecord = (value: number, notes?: string) => {
    if (!selectedSlot) return

    if (selectedSlot.record) {
      updateRecord(selectedSlot.record.id, value, notes)
    } else {
      addRecord(selectedSlot.type, value, notes)
    }
    setSelectedSlot(null)
  }

  // Calculate daily stats (for daily view)
  const stats = useMemo(() => {
    const values = Array.from(dayRecords.values()).map((r) => r.value)
    if (values.length === 0) return null

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
    <DashboardLayout userName={userName}>
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">
              Glucometrias
            </h1>
            <p className="text-muted-foreground text-base leading-normal">
              {viewMode === "daily"
                ? "Registro y edicion"
                : "Seguimiento y tendencias"}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10"
            aria-label="Compartir registros"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </header>

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
            aria-label="Dia anterior"
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
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </span>
            {isToday && (
              <span className="ml-2 text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                Hoy
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            disabled={isToday}
            aria-label="Dia siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Daily View - EDITABLE */}
      {viewMode === "daily" && (
        <>
          {/* XP Summary for today */}
          {isToday && <DailyXPSummary xpResult={xpResult} className="mb-6" />}

          {/* Daily Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Registros</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.count}/6
                </p>
              </article>
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-info" />
                  <span className="text-xs text-muted-foreground">Promedio</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.avg}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    mg/dL
                  </span>
                </p>
              </article>
              <article className="glass-card p-4">
                <span className="text-xs text-muted-foreground">Minimo</span>
                <p className="text-xl font-bold text-warning">
                  {stats.min}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    mg/dL
                  </span>
                </p>
              </article>
              <article className="glass-card p-4">
                <span className="text-xs text-muted-foreground">Maximo</span>
                <p className="text-xl font-bold text-destructive">
                  {stats.max}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    mg/dL
                  </span>
                </p>
              </article>
            </div>
          )}

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-foreground mb-4">
              Registros del dia
            </h2>

            {MEAL_TIME_SLOTS.map((slot, index) => (
              <div
                key={slot.type}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <GlucoseSlotCard
                  type={slot.type}
                  record={dayRecords.get(slot.type)}
                  iconName={slot.icon}
                  onClick={() =>
                    handleSlotClick(slot.type, dayRecords.get(slot.type))
                  }
                />
              </div>
            ))}

            {dayRecords.size === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">
                  Sin registros este dia
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isToday
                    ? "Toca cualquier momento para agregar un registro"
                    : "No hay registros para esta fecha"}
                </p>
              </div>
            )}
          </section>
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

      {/* Input Dialog - only for daily view */}
      {selectedSlot && (
        <DailyLogInputDialog
          open={!!selectedSlot}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
          type="glucose"
          glucometryType={selectedSlot.type}
          initialValue={selectedSlot.record?.value}
          onSave={handleSaveRecord}
        />
      )}
    </DashboardLayout>
  )
}
