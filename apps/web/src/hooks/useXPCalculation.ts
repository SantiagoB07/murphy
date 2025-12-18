"use client"

import { useMemo } from "react"
import type { Glucometry } from "@/types/diabetes"
import {
  calculateRecordsXP,
  calculateInRangeXP,
  calculateWellnessXP,
  getStreakMultiplier,
  getCurrentLevel,
  MIN_REQUIRED_RECORDS,
  MAX_DAILY_XP,
} from "@/lib/xpSystem"

export interface DailyXPResult {
  // XP breakdown
  baseXP: number
  finalXP: number
  breakdown: {
    recordsXP: number
    baseRecordsXP: number
    extraRecordsXP: number
    inRangeXP: number
    wellnessXP: number
  }
  // Streak info
  streakDays: number
  streakMultiplier: number
  // Records info
  recordsCompleted: number
  minRequiredRecords: number
  hasMinRecords: boolean
  // Glucose info
  inRangePercent: number
  // Wellness info
  hasSleepLogged: boolean
  hasStressLogged: boolean
  // Level info
  levelInfo: {
    level: number
    title: string
    currentLevelXP: number
    nextLevelThreshold: number
    progressPercent: number
  }
  // Meta
  maxDailyXP: number
}

interface UseXPCalculationParams {
  todayGlucoseRecords: Glucometry[]
  hasSleepLogged: boolean
  hasStressLogged: boolean
  streakDays: number
  totalAccumulatedXP: number
}

export function useXPCalculation({
  todayGlucoseRecords,
  hasSleepLogged,
  hasStressLogged,
  streakDays,
  totalAccumulatedXP,
}: UseXPCalculationParams): DailyXPResult {
  return useMemo(() => {
    // Calculate records XP
    const recordsCompleted = todayGlucoseRecords.length
    const recordsXPResult = calculateRecordsXP(recordsCompleted)

    // Calculate in-range XP
    const glucoseValues = todayGlucoseRecords.map((r) => r.value)
    const inRangeResult = calculateInRangeXP(glucoseValues)

    // Calculate wellness XP
    const wellnessXP = calculateWellnessXP(hasSleepLogged, hasStressLogged)

    // Calculate base XP
    const baseXP = recordsXPResult.total + inRangeResult.inRangeXP + wellnessXP

    // Apply streak multiplier
    const streakMultiplier = getStreakMultiplier(streakDays)
    const finalXP = Math.round(baseXP * streakMultiplier)

    // Get level info based on total accumulated XP + today's XP
    const totalXP = totalAccumulatedXP + finalXP
    const levelInfo = getCurrentLevel(totalXP)

    return {
      baseXP,
      finalXP,
      breakdown: {
        recordsXP: recordsXPResult.total,
        baseRecordsXP: recordsXPResult.baseXP,
        extraRecordsXP: recordsXPResult.extraXP,
        inRangeXP: inRangeResult.inRangeXP,
        wellnessXP,
      },
      streakDays,
      streakMultiplier,
      recordsCompleted,
      minRequiredRecords: MIN_REQUIRED_RECORDS,
      hasMinRecords: recordsCompleted >= MIN_REQUIRED_RECORDS,
      inRangePercent: inRangeResult.inRangePercent,
      hasSleepLogged,
      hasStressLogged,
      levelInfo,
      maxDailyXP: MAX_DAILY_XP,
    }
  }, [
    todayGlucoseRecords,
    hasSleepLogged,
    hasStressLogged,
    streakDays,
    totalAccumulatedXP,
  ])
}
