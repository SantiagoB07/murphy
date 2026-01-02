"use client"

import { useTranslations } from "next-intl"

interface DashboardHeaderProps {
  userName?: string
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  const t = useTranslations("Dashboard.header")

  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground text-base leading-normal">
            {t("welcomeBack")}
            {userName ? `, ${userName}` : ""}. {t("summary")}
          </p>
        </div>
      </div>
    </header>
  )
}

