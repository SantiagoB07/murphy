import { GLUCOSE_RANGES } from '@/types/diabetes';

// Slot configuration
export const TOTAL_SLOTS = 6;
export const MIN_REQUIRED_SLOTS = 3;

// XP weights for the formula
export const XP_WEIGHTS = {
  IN_RANGE_BONUS: 30,       // Max 30 XP for % in range (70-180 mg/dL)
  REQUIRED_SLOT: 15,        // 15 XP for each of the first 3 slots
  EXTRA_SLOT: 5,            // 5 XP for each additional slot (4th, 5th, 6th)
  SLEEP_LOG: 5,             // 5 XP for logging sleep
  STRESS_LOG: 5,            // 5 XP for logging stress
} as const;

export const STREAK_MULTIPLIER_BASE = 0.03; // +3% per streak day

// XP levels and titles
export const XP_LEVELS = [
  { min: 0, max: 299, title: 'Principiante', level: 1 },
  { min: 300, max: 599, title: 'En Progreso', level: 2 },
  { min: 600, max: 899, title: 'Aprendiz Avanzado', level: 3 },
  { min: 900, max: 1199, title: 'Experto en Glucemia', level: 4 },
  { min: 1200, max: Infinity, title: 'Maestro del Control', level: 5 },
] as const;

// Calculate XP earned from completed slots
export function calculateSlotsXP(completedCount: number): { 
  requiredXP: number; 
  extraXP: number; 
  total: number;
} {
  const requiredSlots = Math.min(completedCount, MIN_REQUIRED_SLOTS);
  const extraSlots = Math.max(0, completedCount - MIN_REQUIRED_SLOTS);
  
  const requiredXP = requiredSlots * XP_WEIGHTS.REQUIRED_SLOT;
  const extraXP = extraSlots * XP_WEIGHTS.EXTRA_SLOT;
  
  return { 
    requiredXP, 
    extraXP, 
    total: requiredXP + extraXP 
  };
}

// Calculate in-range XP based on percentage of readings in range
export function calculateInRangeXP(values: number[]): { 
  inRangePercent: number; 
  inRangeXP: number;
} {
  if (values.length === 0) {
    return { inRangePercent: 0, inRangeXP: 0 };
  }
  
  const inRangeCount = values.filter(
    v => v >= GLUCOSE_RANGES.low && v <= GLUCOSE_RANGES.high
  ).length;
  
  const inRangePercent = (inRangeCount / values.length) * 100;
  const inRangeXP = Math.round((inRangePercent / 100) * XP_WEIGHTS.IN_RANGE_BONUS);
  
  return { inRangePercent, inRangeXP };
}

// Calculate wellness XP (sleep + stress)
export function calculateWellnessXP(
  hasSleepLogged: boolean, 
  hasStressLogged: boolean
): number {
  let wellnessXP = 0;
  if (hasSleepLogged) wellnessXP += XP_WEIGHTS.SLEEP_LOG;
  if (hasStressLogged) wellnessXP += XP_WEIGHTS.STRESS_LOG;
  return wellnessXP;
}

// Calculate streak multiplier
export function getStreakMultiplier(streakDays: number): number {
  return 1 + (streakDays * STREAK_MULTIPLIER_BASE);
}

// Get current level info based on total XP
export function getCurrentLevel(totalXP: number): {
  level: number;
  title: string;
  currentLevelXP: number;
  nextLevelThreshold: number;
  progressPercent: number;
} {
  for (let i = 0; i < XP_LEVELS.length; i++) {
    const levelInfo = XP_LEVELS[i];
    if (totalXP <= levelInfo.max) {
      const levelStartXP = levelInfo.min;
      const levelEndXP = levelInfo.max === Infinity ? levelInfo.min + 300 : levelInfo.max;
      const xpInLevel = totalXP - levelStartXP;
      const levelRange = levelEndXP - levelStartXP;
      
      return {
        level: levelInfo.level,
        title: levelInfo.title,
        currentLevelXP: xpInLevel,
        nextLevelThreshold: levelRange,
        progressPercent: Math.min(100, (xpInLevel / levelRange) * 100),
      };
    }
  }
  
  // Max level reached
  const maxLevel = XP_LEVELS[XP_LEVELS.length - 1];
  return {
    level: maxLevel.level,
    title: maxLevel.title,
    currentLevelXP: 300,
    nextLevelThreshold: 300,
    progressPercent: 100,
  };
}

// Calculate max possible daily XP (for reference)
export const MAX_DAILY_XP = 
  (MIN_REQUIRED_SLOTS * XP_WEIGHTS.REQUIRED_SLOT) + 
  ((TOTAL_SLOTS - MIN_REQUIRED_SLOTS) * XP_WEIGHTS.EXTRA_SLOT) + 
  XP_WEIGHTS.IN_RANGE_BONUS + 
  XP_WEIGHTS.SLEEP_LOG + 
  XP_WEIGHTS.STRESS_LOG;
// = 45 + 15 + 30 + 5 + 5 = 100 XP base max
