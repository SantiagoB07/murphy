"use client"

import { useGlucoseRecords } from "@/features/glucose"
import { useWellnessRecords } from "@/features/wellness"
import { DashboardSkeleton } from "./DashboardSkeleton"
import { StatsSection } from "./StatsSection"
import { WellnessSection } from "./WellnessSection"
import { GlucoseSection } from "./GlucoseSection"
import { XPSection } from "./XPSection"

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

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Data */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">
          <GlucoseSection />
        </div>

        {/* Right Column - XP */}
        <div className="md:col-span-1 lg:col-span-1 space-y-6">
          <XPSection />
        </div>
      </div>
    </>
  )
}

