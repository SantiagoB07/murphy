"use client"

import { useState } from "react"
import { HabitTrackerCard } from "./HabitTrackerCard"
import { WellnessHistorySheet } from "./WellnessHistorySheet"
import {
  useWellnessRecords,
  SleepDialog,
  StressDialog,
  DizzinessDialog,
} from "@/features/wellness"

type WellnessType = "sleep" | "stress" | "dizziness"

export function WellnessSection() {
  // Dialog states
  const [sleepDialogOpen, setSleepDialogOpen] = useState(false)
  const [stressDialogOpen, setStressDialogOpen] = useState(false)
  const [dizzinessDialogOpen, setDizzinessDialogOpen] = useState(false)
  const [historyType, setHistoryType] = useState<WellnessType | null>(null)

  // Wellness data from hook
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
  } = useWellnessRecords()

  return (
    <>
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

      {/* Sleep Dialog */}
      <SleepDialog
        open={sleepDialogOpen}
        onOpenChange={setSleepDialogOpen}
        initialData={todaySleep}
        onSave={saveSleep}
      />

      {/* Stress Dialog */}
      <StressDialog
        open={stressDialogOpen}
        onOpenChange={setStressDialogOpen}
        initialData={todayStress}
        onSave={saveStress}
      />

      {/* Dizziness Dialog */}
      <DizzinessDialog
        open={dizzinessDialogOpen}
        onOpenChange={setDizzinessDialogOpen}
        initialData={todayDizziness}
        onSave={saveDizziness}
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
    </>
  )
}
