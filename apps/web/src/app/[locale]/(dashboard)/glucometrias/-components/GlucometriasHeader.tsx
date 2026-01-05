"use client"

import { useTranslations } from "next-intl"
import type { ViewMode } from "@/features/glucose"

interface GlucometriasHeaderProps {
  viewMode: ViewMode
}

export function GlucometriasHeader({ viewMode }: GlucometriasHeaderProps) {
  const t = useTranslations("Glucometrias")
  return (
    <header className="mb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-base leading-normal">
          {viewMode === "daily" ? t("subtitle.daily") : t("subtitle.readOnly")}
        </p>
      </div>
    </header>
  )
}

