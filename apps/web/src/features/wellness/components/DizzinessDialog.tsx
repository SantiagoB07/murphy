"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import type { DizzinessFormData } from "../wellness.types"

interface DizzinessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: DizzinessFormData | null
  onSave: (data: DizzinessFormData) => void
}

function getSeverityColor(severity: number): string {
  if (severity <= 3) return "text-success"
  if (severity <= 5) return "text-warning"
  if (severity <= 7) return "text-orange-400"
  return "text-destructive"
}

function getSeverityBgColor(severity: number): string {
  if (severity <= 3) return "bg-success/20"
  if (severity <= 5) return "bg-warning/20"
  if (severity <= 7) return "bg-orange-400/20"
  return "bg-destructive/20"
}

export function DizzinessDialog({
  open,
  onOpenChange,
  initialData,
  onSave,
}: DizzinessDialogProps) {
  const t = useTranslations("Dashboard.wellnessDialogs.dizziness")
  const tActions = useTranslations("Dashboard.wellnessDialogs.actions")
  
  const [experienced, setExperienced] = useState<boolean | null>(
    initialData?.experienced ?? null
  )
  const [severity, setSeverity] = useState<number>(initialData?.severity ?? 5)
  const [notes, setNotes] = useState(initialData?.notes ?? "")

  useEffect(() => {
    if (open) {
      setExperienced(initialData?.experienced ?? null)
      setSeverity(initialData?.severity ?? 5)
      setNotes(initialData?.notes ?? "")
    }
  }, [open, initialData])

  const handleSubmit = () => {
    if (experienced === null) return

    if (experienced) {
      onSave({ experienced: true, severity, notes: notes.trim() || undefined })
    } else {
      onSave({ experienced: false })
    }
    onOpenChange(false)
  }

  const getSeverityLabel = (severity: number): string => {
    if (severity <= 2) return t("severity.veryMild")
    if (severity <= 4) return t("severity.mild")
    if (severity <= 6) return t("severity.moderate")
    if (severity <= 8) return t("severity.strong")
    return t("severity.severe")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="w-5 h-5 text-pink-400" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Yes/No question */}
          <div className="space-y-3">
            <Label className="text-muted-foreground">
              {t("questionLabel")}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={experienced === true ? "default" : "outline"}
                onClick={() => setExperienced(true)}
                className={cn(
                  "h-12",
                  experienced === true && "ring-2 ring-primary"
                )}
              >
                {t("yes")}
              </Button>
              <Button
                type="button"
                variant={experienced === false ? "default" : "outline"}
                onClick={() => setExperienced(false)}
                className={cn(
                  "h-12",
                  experienced === false && "ring-2 ring-primary"
                )}
              >
                {t("no")}
              </Button>
            </div>
          </div>

          {/* Show severity slider only if experienced === true */}
          {experienced === true && (
            <>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-muted-foreground">
                    {t("severityLabel")}
                  </Label>
                  <span
                    className={cn(
                      "text-sm font-medium px-3 py-1 rounded",
                      getSeverityBgColor(severity),
                      getSeverityColor(severity)
                    )}
                  >
                    {getSeverityLabel(severity)} ({severity}/10)
                  </span>
                </div>

                <Slider
                  value={[severity]}
                  onValueChange={([v]) => setSeverity(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{t("scaleLabels.min")}</span>
                  <span>{t("scaleLabels.mid")}</span>
                  <span>{t("scaleLabels.max")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dizziness-notes" className="text-muted-foreground">
                  {t("notesLabel")}
                </Label>
                <Textarea
                  id="dizziness-notes"
                  placeholder={t("notesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none h-16"
                  maxLength={200}
                />
              </div>
            </>
          )}

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>{t("tip")}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            {tActions("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={experienced === null}
            className="flex-1 sm:flex-none"
          >
            {tActions("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
