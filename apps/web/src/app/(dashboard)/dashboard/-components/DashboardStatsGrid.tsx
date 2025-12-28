"use client"

import { cn } from "@/lib/utils"
import { type LucideIcon } from "lucide-react"

interface StatItem {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bgColor: string
}

interface DashboardStatsGridProps {
  stats: StatItem[]
}

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <section
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      role="list"
      aria-label="Estadísticas principales"
    >
      {stats.map((stat, index) => (
        <article
          key={stat.label}
          role="listitem"
          className="glass-card p-4 animate-fade-up"
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                stat.bgColor
              )}
            >
              <stat.icon
                className={cn("w-5 h-5", stat.color)}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-foreground leading-tight">
                {stat.value}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}

