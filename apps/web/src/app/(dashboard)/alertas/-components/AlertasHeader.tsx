"use client"

import { Button } from "@/components/ui/button"

interface AlertasHeaderProps {
  unreadCount: number
  onMarkAllRead: () => void
}

export function AlertasHeader({ unreadCount, onMarkAllRead }: AlertasHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
        <p className="text-muted-foreground mt-1">
          Historial de notificaciones
          {unreadCount > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({unreadCount} sin leer)
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
          Marcar todas como leidas
        </Button>
      )}
    </div>
  )
}

