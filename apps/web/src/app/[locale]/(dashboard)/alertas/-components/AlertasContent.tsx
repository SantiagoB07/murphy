"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { AlertasHeader } from "./AlertasHeader"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  Plus,
  Trash2,
  MessageCircle,
  Phone,
  Droplet,
  Syringe,
  Heart,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  CreateAlertDialog,
  useAlertSchedules,
  type AlertChannel,
  type AlertScheduleType,
  type ScheduleFrequency,
  type AlertSeverity,
} from "@/features/alerts"

interface AlertHistoryItem {
  id: number
  type: AlertSeverity
  title: string
  time: string
  value: string
  read: boolean
}

const getAlertIcon = (type: AlertSeverity) => {
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

const getAlertBgColor = (type: AlertSeverity) => {
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

export function AlertasContent() {
  const t = useTranslations("Alertas")

  const initialAlerts: AlertHistoryItem[] = [
    {
      id: 1,
      type: "warning",
      title: t("sampleAlerts.highGlucose"),
      time: t("sampleAlerts.time2Hours"),
      value: "185 mg/dL",
      read: false,
    },
    {
      id: 2,
      type: "info",
      title: t("sampleAlerts.measurementReminder"),
      time: t("sampleAlerts.time4Hours"),
      value: t("sampleAlerts.beforeLunch"),
      read: false,
    },
    {
      id: 3,
      type: "success",
      title: t("sampleAlerts.weeklyGoalMet"),
      time: t("sampleAlerts.yesterday"),
      value: t("sampleAlerts.inRange"),
      read: true,
    },
    {
      id: 4,
      type: "critical",
      title: t("sampleAlerts.hypoglycemiaDetected"),
      time: t("sampleAlerts.time3Days"),
      value: "62 mg/dL",
      read: true,
    },
  ]

  const ALERT_TYPE_CONFIG = {
    glucometry: { label: t("alertTypes.glucometry"), icon: Droplet, color: "red-500" },
    insulin: { label: t("alertTypes.insulin"), icon: Syringe, color: "purple-500" },
    wellness: { label: t("alertTypes.wellness"), icon: Heart, color: "emerald-500" },
    general: { label: t("alertTypes.general"), icon: Bell, color: "sky-500" },
  }

  const ALERT_CHANNEL_CONFIG = {
    whatsapp: { label: t("channels.whatsapp"), icon: MessageCircle, color: "green-500" },
    call: { label: t("channels.call"), icon: Phone, color: "blue-500" },
  }

  const FREQUENCY_LABELS = {
    daily: t("frequency.daily"),
    once: t("frequency.once"),
  }

  const [alerts, setAlerts] = useState<AlertHistoryItem[]>(initialAlerts)
  const [showCreateAlertDialog, setShowCreateAlertDialog] = useState(false)

  // Alert schedules from Convex
  const {
    schedules: alertSchedules,
    addSchedule,
    deleteSchedule,
    isLoading: isLoadingSchedules,
    isPending: isSchedulesPending,
  } = useAlertSchedules()

  const unreadCount = alerts.filter((a) => !a.read).length

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))
    toast.success(t("messages.allMarkedRead"))
  }

  const handleMarkRead = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a))
    )
  }

  const handleAddAlert = async (
    time: string,
    channel: AlertChannel,
    type: AlertScheduleType,
    frequency: ScheduleFrequency
  ) => {
    await addSchedule(time, channel, type, frequency)
  }

  const handleDeleteAlert = (id: string) => {
    deleteSchedule(id)
  }

  return (
    <div className="space-y-6">
      <AlertasHeader unreadCount={unreadCount} onMarkAllRead={handleMarkAllRead} />

      {/* Alert Schedules Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t("myAlerts.title")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateAlertDialog(true)}
            className="gap-1"
          >
            <Plus className="w-4 h-4" />
            {t("myAlerts.add")}
          </Button>
        </div>

        {isLoadingSchedules ? (
          <div className="text-center py-6 glass-card">
            <Loader2 className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">
              {t("myAlerts.loading")}
            </p>
          </div>
        ) : alertSchedules.length === 0 ? (
          <div className="text-center py-6 glass-card">
            <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("myAlerts.noAlerts")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {alertSchedules.map((schedule) => {
              const typeConfig = ALERT_TYPE_CONFIG[schedule.type]
              const channelConfig = ALERT_CHANNEL_CONFIG[schedule.channel]
              const TypeIcon = typeConfig.icon
              const ChannelIcon = channelConfig.icon

              return (
                <div
                  key={schedule.id}
                  className="glass-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-${typeConfig.color}/20 flex items-center justify-center`}>
                      <TypeIcon className={`w-5 h-5 text-${typeConfig.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {schedule.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {typeConfig.label} · {FREQUENCY_LABELS[schedule.frequency]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ChannelIcon className="w-3 h-3" />
                      {channelConfig.label}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteAlert(schedule.id)}
                      disabled={isSchedulesPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Alerts History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t("history.title")}
        </h2>

        {alerts.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{t("history.noAlerts")}</p>
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

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={showCreateAlertDialog}
        onOpenChange={setShowCreateAlertDialog}
        onSubmit={handleAddAlert}
      />
    </div>
  )
}

