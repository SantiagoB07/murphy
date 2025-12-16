import { useMemo } from 'react';
import { Glucometry } from '@/types/diabetes';
import {
  calculateSlotsXP,
  calculateInRangeXP,
  calculateWellnessXP,
  getStreakMultiplier,
  getCurrentLevel,
  TOTAL_SLOTS,
  MIN_REQUIRED_SLOTS,
  MAX_DAILY_XP,
} from '@/lib/xpSystem';

export interface DailyXPResult {
  // XP breakdown
  baseXP: number;
  finalXP: number;
  breakdown: {
    slotsXP: number;
    requiredSlotsXP: number;
    extraSlotsXP: number;
    inRangeXP: number;
    wellnessXP: number;
  };
  // Streak info
  streakDays: number;
  streakMultiplier: number;
  // Slots info
  slotsCompleted: number;
  totalSlots: number;
  minRequiredSlots: number;
  // Glucose info
  inRangePercent: number;
  // Wellness info
  hasSleepLogged: boolean;
  hasStressLogged: boolean;
  // Level info
  levelInfo: {
    level: number;
    title: string;
    currentLevelXP: number;
    nextLevelThreshold: number;
    progressPercent: number;
  };
  // Meta
  maxDailyXP: number;
}

interface UseXPCalculationParams {
  todayGlucoseRecords: Glucometry[];
  hasSleepLogged: boolean;
  hasStressLogged: boolean;
  streakDays: number;
  totalAccumulatedXP: number;
}

export function useXPCalculation({
  todayGlucoseRecords,
  hasSleepLogged,
  hasStressLogged,
  streakDays,
  totalAccumulatedXP,
}: UseXPCalculationParams): DailyXPResult {
  return useMemo(() => {
    // Calculate slots XP
    const slotsCompleted = todayGlucoseRecords.length;
    const slotsXPResult = calculateSlotsXP(slotsCompleted);
    
    // Calculate in-range XP
    const glucoseValues = todayGlucoseRecords.map(r => r.value);
    const inRangeResult = calculateInRangeXP(glucoseValues);
    
    // Calculate wellness XP
    const wellnessXP = calculateWellnessXP(hasSleepLogged, hasStressLogged);
    
    // Calculate base XP
    const baseXP = slotsXPResult.total + inRangeResult.inRangeXP + wellnessXP;
    
    // Apply streak multiplier
    const streakMultiplier = getStreakMultiplier(streakDays);
    const finalXP = Math.round(baseXP * streakMultiplier);
    
    // Get level info based on total accumulated XP + today's XP
    const totalXP = totalAccumulatedXP + finalXP;
    const levelInfo = getCurrentLevel(totalXP);
    
    return {
      baseXP,
      finalXP,
      breakdown: {
        slotsXP: slotsXPResult.total,
        requiredSlotsXP: slotsXPResult.requiredXP,
        extraSlotsXP: slotsXPResult.extraXP,
        inRangeXP: inRangeResult.inRangeXP,
        wellnessXP,
      },
      streakDays,
      streakMultiplier,
      slotsCompleted,
      totalSlots: TOTAL_SLOTS,
      minRequiredSlots: MIN_REQUIRED_SLOTS,
      inRangePercent: inRangeResult.inRangePercent,
      hasSleepLogged,
      hasStressLogged,
      levelInfo,
      maxDailyXP: MAX_DAILY_XP,
    };
  }, [todayGlucoseRecords, hasSleepLogged, hasStressLogged, streakDays, totalAccumulatedXP]);
}
