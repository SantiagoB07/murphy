"use client"

interface SleepData {
  hours: number
  quality: number
}

interface StressData {
  level: number
  notes?: string
}

interface DizzinessData {
  experienced: boolean
  severity?: number // 1-10, only if experienced is true
  notes?: string
}

interface WellnessLogReturn {
  todaySleep: SleepData | null
  todayStress: StressData | null
  todayDizziness: DizzinessData | null
  saveSleep: (data: { hours: number; quality: number }) => void
  saveStress: (data: { level: number; notes?: string }) => void
  saveDizziness: (data: {
    experienced: boolean
    severity?: number
    notes?: string
  }) => void
  isLoading: boolean
  sleepHistory: SleepData[]
  stressHistory: StressData[]
  dizzinessHistory: DizzinessData[]
}

// Mock wellness data for UI development
const MOCK_SLEEP: SleepData = { hours: 7, quality: 8 }
const MOCK_STRESS: StressData = { level: 4 }

export function useWellnessLog(_patientId?: string): WellnessLogReturn {
  // Return mock data - no actual backend calls
  return {
    todaySleep: MOCK_SLEEP,
    todayStress: MOCK_STRESS,
    todayDizziness: null,
    saveSleep: (data) => {
      console.log("[Mock] saveSleep called", data)
    },
    saveStress: (data) => {
      console.log("[Mock] saveStress called", data)
    },
    saveDizziness: (data) => {
      console.log("[Mock] saveDizziness called", data)
    },
    isLoading: false,
    sleepHistory: [
      { hours: 7, quality: 8 },
      { hours: 6.5, quality: 7 },
      { hours: 8, quality: 9 },
    ],
    stressHistory: [{ level: 4 }, { level: 5 }, { level: 3 }],
    dizzinessHistory: [{ experienced: false }],
  }
}
