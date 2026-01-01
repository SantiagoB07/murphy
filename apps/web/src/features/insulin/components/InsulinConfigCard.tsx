"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Syringe } from "lucide-react"
import { useTranslations } from "next-intl"

// InsulinSchedule interface - compatible with Convex schema
export interface InsulinSchedule {
  id: string
  patientId: string
  type: "rapid" | "basal"
  timesPerDay: number
  unitsPerDose: number
  brand?: string
  effectiveFrom: string
  effectiveUntil?: string
  changeReason?: string
  orderedBy?: string
  changedByUserId?: string
  changedByRole?: "patient"
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface InsulinConfigCardProps {
  type: "rapid" | "basal"
  schedule: InsulinSchedule | null
  onUpdate: () => void
}

export function InsulinConfigCard({
  type,
  schedule,
  onUpdate,
}: InsulinConfigCardProps) {
  const t = useTranslations("Insulina")
  const title = type === "rapid" ? t("configCard.rapid") : t("configCard.basal")
  const dailyTotal = schedule ? schedule.timesPerDay * schedule.unitsPerDose : 0

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Syringe className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule ? (
          <>
            {/* Current schedule info */}
            <div className="space-y-3">
              {/* Dose info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("configCard.perApplication")}</p>
                  <p className="text-xl font-bold">{schedule.unitsPerDose}U</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("configCard.frequency")}</p>
                  <p className="text-xl font-bold">{t("configCard.timesPerDay", { times: schedule.timesPerDay })}</p>
                </div>
              </div>

              {/* Daily total */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">{t("configCard.dailyTotal")}</p>
                <p className="text-2xl font-bold text-primary">
                  {dailyTotal}{" "}
                  <span className="text-base font-normal">{t("configCard.unitsLabel")}</span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Syringe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{t("configCard.noConfig")}</p>
            <p className="text-xs">{t("configCard.configureDose", { type: title.toLowerCase() })}</p>
          </div>
        )}

        <Button onClick={onUpdate} className="w-full h-[44px]">
          {schedule ? t("configCard.updateDose") : t("configCard.configureDoseButton")}
        </Button>
      </CardContent>
    </Card>
  )
}

