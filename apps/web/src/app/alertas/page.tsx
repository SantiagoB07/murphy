"use client"

import { useState } from "react"
import { useUser, SignInButton } from "@clerk/nextjs"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { Bell, AlertTriangle, CheckCircle, Clock, Info } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type AlertType = "warning" | "success" | "info" | "critical"

interface Alert {
  id: number
  type: AlertType
  title: string
  time: string
  value: string
  read: boolean
}

const initialAlerts: Alert[] = [
  {
    id: 1,
    type: "warning",
    title: "Glucosa alta detectada",
    time: "Hace 2 horas",
    value: "185 mg/dL",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "Recordatorio de medicion",
    time: "Hace 4 horas",
    value: "Antes de almuerzo",
    read: false,
  },
  {
    id: 3,
    type: "success",
    title: "Meta semanal cumplida",
    time: "Ayer",
    value: "85% en rango",
    read: true,
  },
  {
    id: 4,
    type: "critical",
    title: "Hipoglucemia detectada",
    time: "Hace 3 dias",
    value: "62 mg/dL",
    read: true,
  },
  {
    id: 5,
    type: "info",
    title: "Nueva racha de 7 dias",
    time: "Hace 5 dias",
    value: "+50 XP bonus",
    read: true,
  },
]

const getAlertIcon = (type: AlertType) => {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-5 h-5 text-warning" />
    case "critical":
      return <AlertTriangle className="w-5 h-5 text-destructive" />
    case "success":
      return <CheckCircle className="w-5 h-5 text-success" />
    case "info":
    default:
      return <Info className="w-5 h-5 text-info" />
  }
}

const getAlertBgColor = (type: AlertType) => {
  switch (type) {
    case "warning":
      return "bg-warning/20"
    case "critical":
      return "bg-destructive/20"
    case "success":
      return "bg-success/20"
    case "info":
    default:
      return "bg-info/20"
  }
}

export default function AlertasPage() {
  return (
    <>
      <Authenticated>
        <AlertasContent />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Murphy</h1>
            <p className="text-muted-foreground">
              Inicia sesion para ver tus alertas
            </p>
            <SignInButton mode="modal">
              <button className="btn-neon px-6 py-2 rounded-xl">
                Iniciar Sesion
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AuthLoading>
    </>
  )
}

function AlertasContent() {
  const { user } = useUser()
  const userName = user?.firstName || "Usuario"
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)

  const unreadCount = alerts.filter((a) => !a.read).length

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    toast.success("Todas las alertas marcadas como leidas")
  }

  const handleMarkRead = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    )
  }

  return (
    <DashboardLayout userName={userName} userRole="patient">
      <div className="space-y-6">
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
              onClick={handleMarkAllRead}
            >
              Marcar todas como leidas
            </Button>
          )}
        </div>

        {/* Alerts History */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Historial
          </h2>

          {alerts.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No tienes alertas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => handleMarkRead(alert.id)}
                  className={`glass-card p-4 flex items-start gap-4 w-full text-left transition-opacity ${
                    alert.read ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getAlertBgColor(
                      alert.type
                    )}`}
                  >
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{alert.title}</p>
                      {!alert.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.value}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    {alert.time}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Future: AI Call Schedule Manager will go here */}
        <div className="glass-card p-4 border-dashed border-2 border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                Alertas Automaticas
              </h3>
              <p className="text-sm text-muted-foreground">
                Proximamente: Programa recordatorios por llamada o WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
