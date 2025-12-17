"use client"

import { useState, useMemo } from "react"
import { useUser } from "@clerk/nextjs"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { HabitTrackerCard } from "./-components/HabitTrackerCard"
import { XPDonut } from "./-components/XPDonut"
import { GlucoseChart } from "@/components/dashboard/GlucoseChart"
import { DailyLogInputDialog } from "@/components/daily-log/DailyLogInputDialog"
import { WellnessHistorySheet } from "./-components/WellnessHistorySheet"
import { useXPCalculation } from "@/hooks/useXPCalculation"
import { useWellnessLog } from "@/hooks/useWellnessLog"
import { useGlucoseLog } from "@/hooks/useGlucoseLog"
import { Activity, TrendingUp, Flame, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useUser()

  // Dialog states for wellness tracking
  const [sleepDialogOpen, setSleepDialogOpen] = useState(false)
  const [stressDialogOpen, setStressDialogOpen] = useState(false)
  const [dizzinessDialogOpen, setDizzinessDialogOpen] = useState(false)
  const [historyType, setHistoryType] = useState<
    "sleep" | "stress" | "dizziness" | null
  >(null)

  // Wellness data from Convex hooks
  const {
    todaySleep,
    todayStress,
    todayDizziness,
    saveSleep,
    saveStress,
    saveDizziness,
    sleepHistory,
    stressHistory,
    dizzinessHistory,
    isLoading: wellnessLoading,
  } = useWellnessLog()

  // Glucose data from Convex hook
  const { records, todayRecords, isLoading: glucoseLoading } = useGlucoseLog()

  // Get user name from Clerk
  const userName = user?.firstName || "Usuario"

  // Get today's glucose records (already an array)
  const todayGlucoseRecords = todayRecords

  // Calculate streak from glucose records (simplified - count consecutive days with records)
  const streakDays = useMemo(() => {
    const dates = new Set(
      records.map((r) => r.timestamp.split("T")[0])
    )
    let streak = 0
    const today = new Date()

    for (let i = 0; i < 365; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      if (dates.has(dateStr)) {
        streak++
      } else if (i > 0) {
        break
      }
    }

    return streak
  }, [records])

  // Calculate XP using the hook
  const xpResult = useXPCalculation({
    todayGlucoseRecords,
    hasSleepLogged: !!todaySleep,
    hasStressLogged: !!todayStress,
    streakDays,
    totalAccumulatedXP: 0, // Will be calculated from historical data later
  })

  // Get last glucose value
  const lastGlucoseValue = useMemo(() => {
    if (todayGlucoseRecords.length > 0) {
      return todayGlucoseRecords[0].value
    }
    if (records.length > 0) {
      return records[0].value
    }
    return null
  }, [todayGlucoseRecords, records])

  // Stats cards data
  const stats = [
    {
      label: "Última glucosa",
      value: lastGlucoseValue ? `${lastGlucoseValue} mg/dL` : "-",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      label: "Tendencia semanal",
      value: "-5.2%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/20",
    },
    {
      label: "Días en racha",
      value: `${streakDays}`,
      icon: Flame,
      color: "text-warning",
      bgColor: "bg-warning/20",
    },
    {
      label: "Alertas activas",
      value: "0",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/20",
    },
  ]

  // Show loading state
  if (wellnessLoading || glucoseLoading) {
    return (
      <DashboardLayout userName={userName} userRole="patient">
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userName={userName} userRole="patient">
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
              Mi Dashboard
            </h1>
            <p className="text-muted-foreground text-base leading-normal">
              Bienvenido de vuelta
              {userName ? `, ${userName}` : ""}. Aquí tienes tu resumen del día.
            </p>
          </div>
        </div>
      </header>

      {/* Stats Grid - 4 columns from tablet */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        role="list"
        aria-label="Estadísticas principales"
      >
        {stats.map((stat, index) => (
          <article
            key={stat.label}
            role="listitem"
            className="glass-card p-4 animate-fade-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  stat.bgColor
                )}
              >
                <stat.icon
                  className={cn("w-5 h-5", stat.color)}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground leading-tight">
                  {stat.value}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Bienestar Diario - Full width, above the main grid */}
      <section className="mb-6">
        <HabitTrackerCard
          sleepData={todaySleep}
          stressData={todayStress}
          dizzinessData={todayDizziness}
          onSleepClick={() => setSleepDialogOpen(true)}
          onStressClick={() => setStressDialogOpen(true)}
          onDizzinessClick={() => setDizzinessDialogOpen(true)}
          onViewHistory={(type) => setHistoryType(type)}
        />
      </section>

      {/* Main content grid - responsive breakpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Data (full on mobile, half on tablet, 2/3 on desktop) */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">
          <GlucoseChart data={records} />
        </div>

        {/* Right Column - XP (full on mobile, half on tablet, 1/3 on desktop) */}
        <div className="md:col-span-1 lg:col-span-1 space-y-6">
          <XPDonut
            totalXP={
              xpResult.levelInfo.currentLevelXP +
              (xpResult.levelInfo.level - 1) * 300
            }
            todayXP={xpResult.finalXP}
            currentLevelXP={xpResult.levelInfo.currentLevelXP}
            nextLevelThreshold={xpResult.levelInfo.nextLevelThreshold}
            streak={xpResult.streakDays}
            levelTitle={xpResult.levelInfo.title}
            streakMultiplier={xpResult.streakMultiplier}
            slotsToday={xpResult.recordsCompleted}
            progressPercent={xpResult.levelInfo.progressPercent}
          />
        </div>
      </div>

      {/* Sleep Dialog */}
      <DailyLogInputDialog
        type="sleep"
        open={sleepDialogOpen}
        onOpenChange={setSleepDialogOpen}
        initialHours={todaySleep?.hours}
        initialQuality={todaySleep?.quality}
        onSave={(hours, quality) => {
          saveSleep({ hours, quality: quality ?? 5 })
        }}
      />

      {/* Stress Dialog */}
      <DailyLogInputDialog
        type="stress"
        open={stressDialogOpen}
        onOpenChange={setStressDialogOpen}
        initialLevel={todayStress?.level}
        initialNotes={todayStress?.notes}
        onSave={(level, notes) => {
          saveStress({ level, notes })
        }}
      />

      {/* Dizziness Dialog */}
      <DailyLogInputDialog
        type="dizziness"
        open={dizzinessDialogOpen}
        onOpenChange={setDizzinessDialogOpen}
        initialExperienced={todayDizziness?.experienced}
        initialSeverity={todayDizziness?.severity}
        initialNotes={todayDizziness?.notes}
        onSave={(data) => {
          saveDizziness(data)
        }}
      />

      {/* Wellness History Sheet */}
      <WellnessHistorySheet
        open={historyType !== null}
        onOpenChange={(open) => {
          if (!open) setHistoryType(null)
        }}
        type={historyType ?? "sleep"}
        data={
          historyType === "sleep"
            ? sleepHistory
            : historyType === "stress"
              ? stressHistory
              : dizzinessHistory
        }
      />
    </DashboardLayout>
  )
}
