"use client"

import { useState } from "react"
import { InsulinaHeader } from "./InsulinaHeader"
import { InsulinConfigCard } from "./InsulinConfigCard"
import { InsulinUpdateDialog } from "./InsulinUpdateDialog"
import { InsulinTodoList } from "./InsulinTodoList"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"
import {
  useInsulinSchedule,
  useInsulinDoseRecords,
  type UpdateInsulinData,
} from "@/features/insulin"
import { toast } from "sonner"

export function InsulinaContent() {
  const {
    rapidSchedule,
    basalSchedule,
    isLoading,
    updateSchedule,
    isUpdating,
  } = useInsulinSchedule()

  const {
    todayRecords,
    createDoseRecord,
    isCreating,
    deleteDoseRecord,
    isDeleting,
  } = useInsulinDoseRecords()

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<"rapid" | "basal">("rapid")

  const handleOpenUpdate = (type: "rapid" | "basal") => {
    setSelectedType(type)
    setUpdateDialogOpen(true)
  }

  const handleSaveUpdate = (data: UpdateInsulinData) => {
    updateSchedule(
      { insulinType: selectedType, data },
      {
        onSuccess: () => {
          toast.success(
            `${selectedType === "rapid" ? "Insulina rapida" : "Insulina basal"} actualizada`
          )
          setUpdateDialogOpen(false)
        },
        onError: (error) => {
          toast.error("Error al guardar: " + error.message)
        },
      }
    )
  }

  const totalDailyUnits =
    (rapidSchedule ? rapidSchedule.timesPerDay * rapidSchedule.unitsPerDose : 0) +
    (basalSchedule ? basalSchedule.timesPerDay * basalSchedule.unitsPerDose : 0)

  const totalApplications =
    (rapidSchedule?.timesPerDay ?? 0) + (basalSchedule?.timesPerDay ?? 0)

  return (
    <div className="space-y-6">
      <InsulinaHeader />

      {/* Config cards */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[280px] bg-muted/20 rounded-lg animate-pulse" />
          <div className="h-[280px] bg-muted/20 rounded-lg animate-pulse" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <InsulinConfigCard
            type="rapid"
            schedule={rapidSchedule}
            onUpdate={() => handleOpenUpdate("rapid")}
          />
          <InsulinConfigCard
            type="basal"
            schedule={basalSchedule}
            onUpdate={() => handleOpenUpdate("basal")}
          />
        </div>
      )}

      {/* Summary card */}
      {totalDailyUnits > 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resumen diario</p>
                <p className="font-medium">
                  {totalApplications} aplicaciones - {totalDailyUnits} unidades
                  totales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todo list - daily applications */}
      {!isLoading && (rapidSchedule || basalSchedule) && (
        <InsulinTodoList
          rapidSchedule={rapidSchedule}
          basalSchedule={basalSchedule}
          todayRecords={todayRecords}
          onLogDose={(data) => {
            createDoseRecord(
              {
                insulinType: data.insulinType,
                dose: data.dose,
                administeredAt: data.administeredAt.getTime(),
              },
              {
                onSuccess: () => {
                  toast.success("Dosis registrada correctamente")
                },
                onError: (error) => {
                  toast.error("Error al registrar: " + error.message)
                },
              }
            )
          }}
          onUndoDose={(recordId) => {
            deleteDoseRecord(recordId, {
              onSuccess: () => {
                toast.success("Registro eliminado")
              },
              onError: (error) => {
                toast.error("Error al eliminar: " + error.message)
              },
            })
          }}
          isLogging={isCreating}
          isDeleting={isDeleting}
        />
      )}

      {/* Update dialog */}
      <InsulinUpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        type={selectedType}
        currentSchedule={selectedType === "rapid" ? rapidSchedule : basalSchedule}
        onSave={handleSaveUpdate}
        isLoading={isUpdating}
      />
    </div>
  )
}

