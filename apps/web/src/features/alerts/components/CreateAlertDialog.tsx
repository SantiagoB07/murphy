"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { 
  Bell, 
  Phone, 
  MessageCircle, 
  Loader2, 
  Droplet, 
  Syringe, 
  Heart,
  ArrowLeft,
  Repeat,
  Calendar,
} from "lucide-react"
import type { AlertChannel, AlertScheduleType, ScheduleFrequency } from "../alerts.types"

interface CreateAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    time: string,
    channel: AlertChannel,
    type: AlertScheduleType,
    frequency: ScheduleFrequency
  ) => Promise<void>
}

export function CreateAlertDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateAlertDialogProps) {
  const t = useTranslations("Alertas")
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<AlertScheduleType | null>(null)
  const [time, setTime] = useState("08:00")
  const [channel, setChannel] = useState<AlertChannel>("whatsapp")
  const [frequency, setFrequency] = useState<ScheduleFrequency>("daily")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const ALERT_TYPES = [
    {
      value: "glucometry" as const,
      label: t("alertTypes.glucometry"),
      description: t("alertTypesDescriptions.glucometry"),
      icon: Droplet,
      color: "red-500",
    },
    {
      value: "insulin" as const,
      label: t("alertTypes.insulin"),
      description: t("alertTypesDescriptions.insulin"),
      icon: Syringe,
      color: "purple-500",
    },
    {
      value: "wellness" as const,
      label: t("alertTypes.wellness"),
      description: t("alertTypesDescriptions.wellness"),
      icon: Heart,
      color: "emerald-500",
    },
    {
      value: "general" as const,
      label: t("alertTypes.general"),
      description: t("alertTypesDescriptions.general"),
      icon: Bell,
      color: "sky-500",
    },
  ]

  const CHANNELS = [
    {
      value: "whatsapp" as const,
      label: t("channels.whatsapp"),
      description: t("channelsDescriptions.whatsapp"),
      icon: MessageCircle,
      color: "green-500",
    },
    {
      value: "call" as const,
      label: t("channels.call"),
      description: t("channelsDescriptions.call"),
      icon: Phone,
      color: "blue-500",
    },
  ]

  const handleSelectType = (type: AlertScheduleType) => {
    setSelectedType(type)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async () => {
    if (!selectedType) return

    setIsSubmitting(true)
    try {
      await onSubmit(time, channel, selectedType, frequency)
      // Reset form
      setStep(1)
      setSelectedType(null)
      setTime("08:00")
      setChannel("whatsapp")
      setFrequency("daily")
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating alert:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset when closing
      setStep(1)
      setSelectedType(null)
      setTime("08:00")
      setChannel("whatsapp")
      setFrequency("daily")
    }
    onOpenChange(newOpen)
  }

  const selectedTypeConfig = ALERT_TYPES.find((t) => t.value === selectedType)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="mr-1 hover:bg-muted/50 rounded-lg p-1 transition-colors"
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Bell className="w-5 h-5 text-primary" />
            {step === 1 ? t("createDialog.step1.title") : t("createDialog.step2.title", { type: selectedTypeConfig?.label || "" })}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1
              ? t("createDialog.step1.description")
              : t("createDialog.step2.description")}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // Step 1: Select alert type
          <div className="space-y-2 py-4">
            {ALERT_TYPES.map((alertType) => {
              const Icon = alertType.icon
              return (
                <button
                  key={alertType.value}
                  onClick={() => handleSelectType(alertType.value)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                >
                  <div
                    className={`w-10 h-10 rounded-xl bg-${alertType.color}/20 flex items-center justify-center shrink-0`}
                  >
                    <Icon className={`w-5 h-5 text-${alertType.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{alertType.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {alertType.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          // Step 2: Configure time, frequency and channel
          <div className="space-y-6 py-4">
            {/* Time picker */}
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium text-foreground">
                {t("createDialog.step2.time")}
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-muted/30 border-border/50"
              />
            </div>

            {/* Frequency selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                {t("createDialog.step2.when")}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFrequency("daily")}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                    frequency === "daily"
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
                  }`}
                >
                  <Repeat className={`w-4 h-4 ${frequency === "daily" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${frequency === "daily" ? "text-primary" : "text-foreground"}`}>
                    {t("frequency.daily")}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("once")}
                  className={`flex items-center gap-2 p-3 rounded-xl transition-colors ${
                    frequency === "once"
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted/30 border-2 border-transparent hover:bg-muted/50"
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${frequency === "once" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`text-sm font-medium ${frequency === "once" ? "text-primary" : "text-foreground"}`}>
                    {t("frequency.once")}
                  </span>
                </button>
              </div>
            </div>

            {/* Channel selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                {t("createDialog.step2.notifyBy")}
              </Label>
              <RadioGroup
                value={channel}
                onValueChange={(value) => setChannel(value as AlertChannel)}
                className="space-y-2"
              >
                {CHANNELS.map((channelOption) => {
                  const Icon = channelOption.icon
                  return (
                    <label
                      key={channelOption.value}
                      htmlFor={`channel-${channelOption.value}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <RadioGroupItem
                        value={channelOption.value}
                        id={`channel-${channelOption.value}`}
                      />
                      <div
                        className={`w-10 h-10 rounded-xl bg-${channelOption.color}/20 flex items-center justify-center`}
                      >
                        <Icon className={`w-5 h-5 text-${channelOption.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {channelOption.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {channelOption.description}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 sm:flex-none"
              disabled={isSubmitting}
            >
              {t("createDialog.step2.back")}
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none"
              disabled={isSubmitting || !time}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("createDialog.step2.creating")}
                </>
              ) : (
                t("createDialog.step2.create")
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

