"use client"

import { useTranslations } from "next-intl"

export function AlertasHeader() {
  const t = useTranslations("Alertas")

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{t("header.title")}</h1>
      <p className="text-muted-foreground mt-1">{t("header.subtitle")}</p>
    </div>
  )
}

