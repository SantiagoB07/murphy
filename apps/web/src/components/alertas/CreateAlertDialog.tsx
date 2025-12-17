"use client"

import { useState } from "react"
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
import type { AlertChannel, AlertScheduleType, ScheduleFrequency } from "@/types/diabetes"

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

const ALERT_TYPES = [
  {
    value: "glucometry" as const,
    label: "Glucometría",
    description: "Medición de glucosa",
    icon: Droplet,
    color: "red-500",
  },
  {
    value: "insulin" as const,
    label: "Insulina",
    description: "Aplicación de insulina",
    icon: Syringe,
    color: "purple-500",
  },
  {
    value: "wellness" as const,
    label: "Bienestar",
    description: "Sueño, estrés o mareos",
    icon: Heart,
    color: "emerald-500",
  },
  {
    value: "general" as const,
    label: "General",
    description: "Recordatorio general",
    icon: Bell,
    color: "sky-500",
  },
]

const CHANNELS = [
  {
    value: "whatsapp" as const,
    label: "WhatsApp",
    description: "Mensaje de texto",
    icon: MessageCircle,
    color: "green-500",
  },
  {
    value: "call" as const,
    label: "Llamada",
    description: "Llamada telefónica",
    icon: Phone,
    color: "blue-500",
  },
]

export function CreateAlertDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateAlertDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<AlertScheduleType | null>(null)
  const [time, setTime] = useState("08:00")
  const [channel, setChannel] = useState<AlertChannel>("whatsapp")
  const [frequency, setFrequency] = useState<ScheduleFrequency>("daily")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
            {step === 1 ? "Nueva alerta" : `Alerta de ${selectedTypeConfig?.label}`}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {step === 1
              ? "¿Qué tipo de recordatorio necesitas?"
              : "Configura tu recordatorio"}
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
                Hora
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
                ¿Cuándo?
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
                    Todos los días
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
                    Solo hoy
                  </span>
                </button>
              </div>
            </div>

            {/* Channel selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Notificarme por
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
              Atrás
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 sm:flex-none"
              disabled={isSubmitting || !time}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear alerta"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
