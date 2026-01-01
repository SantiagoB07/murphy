"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

interface AlertasHeaderProps {
  unreadCount: number
  onMarkAllRead: () => void
}

export function AlertasHeader({ unreadCount, onMarkAllRead }: AlertasHeaderProps) {
  const t = useTranslations("Alertas")

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("header.title")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("header.subtitle")}
          {unreadCount > 0 && (
            <span className="ml-2 text-primary font-medium">
              {t("header.unread", { count: unreadCount })}
            </span>
          )}
        </p>
      </div>
      {unreadCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
          onClick={onMarkAllRead}
        >
          {t("header.markAllRead")}
        </Button>
      )}
    </div>
  )
}

