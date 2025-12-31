"use client"

import { useGlucoseRecords } from "@/features/glucose"
import { useWellnessRecords } from "@/features/wellness"
import { DashboardSkeleton } from "./DashboardSkeleton"
import { StatsSection } from "./StatsSection"
import { WellnessSection } from "./WellnessSection"
import { GlucoseSection } from "./GlucoseSection"

export function DashboardContent() {
  const { isLoading: glucoseLoading } = useGlucoseRecords()
  const { isLoading: wellnessLoading } = useWellnessRecords()

  // Show loading state
  if (wellnessLoading || glucoseLoading) {
    return <DashboardSkeleton />
  }

  return (
    <>
      {/* Stats Grid */}
      <StatsSection />

      {/* Bienestar Diario */}
      <WellnessSection />

      {/* Main content - Glucose Section */}
      <GlucoseSection />
    </>
  )
}

