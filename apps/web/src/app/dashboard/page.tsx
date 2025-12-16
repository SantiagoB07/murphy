"use client"

import { useState, useMemo } from "react"
import { useUser, SignInButton, UserButton } from "@clerk/nextjs"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"

import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { HabitTrackerCard } from "./-components/HabitTrackerCard"
import { XPDonut } from "./-components/XPDonut"
import { GlucoseChart } from "@/components/dashboard/GlucoseChart"
import { DailyLogInputDialog } from "@/components/daily-log/DailyLogInputDialog"
import { WellnessHistorySheet } from "./-components/WellnessHistorySheet"
import { useXPCalculation } from "@/hooks/useXPCalculation"
import { useWellnessLog } from "@/hooks/useWellnessLog"
import { useGlucoseLog } from "@/hooks/useGlucoseLog"
import type { Patient, Glucometry } from "@/types/diabetes"
import mockData from "@/data/mockPatients.json"
import { Activity, TrendingUp, Flame, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

function DashboardContent() {
  const { user } = useUser()

  // Dialog states for wellness tracking
  const [sleepDialogOpen, setSleepDialogOpen] = useState(false)
  const [stressDialogOpen, setStressDialogOpen] = useState(false)
  const [dizzinessDialogOpen, setDizzinessDialogOpen] = useState(false)
  const [historyType, setHistoryType] = useState<
    "sleep" | "stress" | "dizziness" | null
  >(null)

  // Wellness data from mock hook
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
  } = useWellnessLog()

  // Glucose data from mock hook
  const { records, todayRecords } = useGlucoseLog()

  // Get mock patient data
  const currentPatient = mockData.patients[0] as Patient

  // Get user name from Clerk or mock data
  const userName = user?.firstName || currentPatient.name.split(" ")[0]

  // Get today's glucose records
  const todayGlucoseRecords = useMemo(() => {
    if (todayRecords.size > 0) {
      return Array.from(todayRecords.values())
    }
    return []
  }, [todayRecords])

  // Calculate XP using the hook
  const xpResult = useXPCalculation({
    todayGlucoseRecords,
    hasSleepLogged: !!todaySleep,
    hasStressLogged: !!todayStress,
    streakDays: currentPatient.streak,
    totalAccumulatedXP: currentPatient.xpLevel * 10,
  })

  // Stats cards data
  const stats = [
    {
      label: "Última glucosa",
      value: `${(currentPatient.glucometrias as Glucometry[])[0]?.value || "-"} mg/dL`,
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
      value: `${currentPatient.streak}`,
      icon: Flame,
      color: "text-warning",
      bgColor: "bg-warning/20",
    },
    {
      label: "Alertas activas",
      value: currentPatient.alertas.filter((a) => !a.resolved).length.toString(),
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/20",
    },
  ]

  return (
    <DashboardLayout userName={userName}>
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
          <UserButton />
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
            slotsToday={xpResult.slotsCompleted}
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

export default function DashboardPage() {
  return (
    <>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Murphy</h1>
            <p className="text-muted-foreground">
              Inicia sesión para acceder a tu dashboard
            </p>
            <SignInButton mode="modal">
              <button className="btn-neon px-6 py-2 rounded-xl">
                Iniciar Sesión
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AuthLoading>
    </>
  )
}
