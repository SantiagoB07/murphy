"use client"

import { GlucoseChart } from "@/components/dashboard/GlucoseChart"
import { useGlucoseRecords } from "@/features/glucose"

export function GlucoseSection() {
  const { records } = useGlucoseRecords()

  // Transform records for the chart (expects timestamp as ISO string)
  const chartData = records.map((r) => ({
    id: r._id,
    value: r.value,
    timestamp: new Date(r.recordedAt).toISOString(),
    slot: r.slot,
    notes: r.notes,
  }))

  return <GlucoseChart data={chartData} />
}

