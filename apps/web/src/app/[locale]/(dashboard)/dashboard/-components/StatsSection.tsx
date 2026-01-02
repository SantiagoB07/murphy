"use client"

import { useMemo } from "react"
import { useTranslations } from "next-intl"
import { Activity, TrendingUp, Flame, AlertTriangle } from "lucide-react"
import { DashboardStatsGrid } from "./DashboardStatsGrid"
import { useGlucoseRecords } from "@/features/glucose"

export function StatsSection() {
  const t = useTranslations("Dashboard.stats")
  const { records, todayRecords } = useGlucoseRecords()

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

  // Get last glucose value
  const lastGlucoseValue = useMemo(() => {
    if (todayRecords.length > 0) {
      return todayRecords[0].value
    }
    if (records.length > 0) {
      return records[0].value
    }
    return null
  }, [todayRecords, records])

  const stats = [
    {
      label: t("lastGlucose"),
      value: lastGlucoseValue ? `${lastGlucoseValue} mg/dL` : "-",
      icon: Activity,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
    },
    {
      label: t("weeklyTrend"),
      value: "-5.2%",
      icon: TrendingUp,
      color: "text-success",
      bgColor: "bg-success/20",
    },
    {
      label: t("streakDays"),
      value: `${streakDays}`,
      icon: Flame,
      color: "text-warning",
      bgColor: "bg-warning/20",
    },
    {
      label: t("activeAlerts"),
      value: "0",
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/20",
    },
  ]

  return <DashboardStatsGrid stats={stats} />
}

