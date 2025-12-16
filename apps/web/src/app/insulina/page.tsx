"use client"

import { useState } from "react"
import { useUser, SignInButton } from "@clerk/nextjs"
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { InsulinConfigCard } from "./-components/InsulinConfigCard"
import { InsulinUpdateDialog } from "./-components/InsulinUpdateDialog"
import { InsulinTodoList } from "./-components/InsulinTodoList"
import { Card, CardContent } from "@/components/ui/card"
import { Activity } from "lucide-react"
import {
  useInsulinSchedule,
  type UpdateInsulinData,
} from "@/hooks/useInsulinSchedule"
import { useInsulinDoseRecords } from "@/hooks/useInsulinDoseRecords"
import { toast } from "sonner"

function InsulinaContent() {
  const { user } = useUser()
  const userName = user?.firstName || "Usuario"

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
    <DashboardLayout userName={userName} userRole="patient">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insulina</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu regimen de insulina rapida y basal
          </p>
        </div>

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
            isLogging={isCreating}
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
    </DashboardLayout>
  )
}

export default function InsulinaPage() {
  return (
    <>
      <Authenticated>
        <InsulinaContent />
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Murphy</h1>
            <p className="text-muted-foreground">
              Inicia sesion para acceder a tu configuracion de insulina
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
