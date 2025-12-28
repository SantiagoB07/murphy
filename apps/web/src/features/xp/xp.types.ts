// XP feature types - frontend only

export interface XPBreakdown {
  recordsXP: number
  baseRecordsXP: number
  extraRecordsXP: number
  inRangeXP: number
  wellnessXP: number
}

export interface LevelInfo {
  level: number
  title: string
  currentLevelXP: number
  nextLevelThreshold: number
  progressPercent: number
}

export interface DailyXPResult {
  // XP breakdown
  baseXP: number
  finalXP: number
  breakdown: XPBreakdown
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
  levelInfo: LevelInfo
  // Meta
  maxDailyXP: number
}

export interface DailyXPLog {
  date: string
  baseXP: number
  finalXP: number
  recordsCompleted: number
  inRangePercent: number
  streakDays: number
  streakMultiplier: number
}

