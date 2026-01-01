"use client"

import { useTranslations } from "next-intl"

export function InsulinaHeader() {
  const t = useTranslations("Insulina.header")

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">
        {t("subtitle")}
      </p>
    </div>
  )
}

