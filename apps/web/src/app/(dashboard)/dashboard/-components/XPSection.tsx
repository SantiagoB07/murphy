"use client"

import { useMemo } from "react"
import { XPDonut } from "./XPDonut"
import { useGlucoseRecords } from "@/features/glucose"
import { useWellnessRecords } from "@/features/wellness"
import { useXPCalculation } from "@/features/xp"

export function XPSection() {
  const { records, todayRecords } = useGlucoseRecords()
  const { todaySleep, todayStress } = useWellnessRecords()

  // Calculate streak from glucose records
  const streakDays = useMemo(() => {
    const dates = new Set(
      records.map((r) => new Date(r.recordedAt).toISOString().split("T")[0])
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

  // Transform records for XP calculation
  const todayGlucoseRecords = useMemo(() => {
    return todayRecords.map((r) => ({
      id: r._id,
      value: r.value,
      timestamp: new Date(r.recordedAt).toISOString(),
      slot: r.slot,
      notes: r.notes,
    }))
  }, [todayRecords])

  // Calculate XP
  const xpResult = useXPCalculation({
    todayGlucoseRecords,
    hasSleepLogged: !!todaySleep,
    hasStressLogged: !!todayStress,
    streakDays,
    totalAccumulatedXP: 0,
  })

  return (
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
  )
}

