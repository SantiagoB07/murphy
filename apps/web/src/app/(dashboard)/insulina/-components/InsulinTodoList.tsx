"use client"

import { useState } from "react"
import { Check, Circle, Syringe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import type { InsulinSchedule } from "@/types/diabetes"
import type { InsulinDoseRecord } from "@/features/insulin"

// ID type for insulin dose records - using string since that's what the hook provides
type InsulinDoseRecordId = string
import { InsulinLogDialog } from "./InsulinLogDialog"

interface TodoItem {
  id: string
  insulinType: "rapid" | "basal"
  label: string
  dose: number
  completed: boolean
  recordId?: InsulinDoseRecordId // ID of the actual record if completed
  administeredAt?: number // Timestamp when administered
}

interface InsulinTodoListProps {
  rapidSchedule: InsulinSchedule | null
  basalSchedule: InsulinSchedule | null
  todayRecords: InsulinDoseRecord[]
  onLogDose: (data: {
    insulinType: "rapid" | "basal"
    dose: number
    administeredAt: Date
  }) => void
  onUndoDose: (recordId: InsulinDoseRecordId) => void
  isLogging?: boolean
  isDeleting?: boolean
}

// Generate todo items based on schedules and today's completed records
function generateTodoItems(
  rapidSchedule: InsulinSchedule | null,
  basalSchedule: InsulinSchedule | null,
  todayRecords: InsulinDoseRecord[]
): TodoItem[] {
  const items: TodoItem[] = []

  // Get records by type, sorted by time (oldest first)
  const rapidRecords = todayRecords
    .filter((r) => r.insulinType === "rapid")
    .sort((a, b) => a.administeredAt - b.administeredAt)
  const basalRecords = todayRecords
    .filter((r) => r.insulinType === "basal")
    .sort((a, b) => a.administeredAt - b.administeredAt)

  // Generate rapid insulin todos
  if (rapidSchedule) {
    for (let i = 0; i < rapidSchedule.timesPerDay; i++) {
      const record = rapidRecords[i]
      items.push({
        id: `rapid-${i}`,
        insulinType: "rapid",
        label: `Insulina Rapida #${i + 1}`,
        dose: record?.dose ?? rapidSchedule.unitsPerDose,
        completed: !!record,
        recordId: record?._id,
        administeredAt: record?.administeredAt,
      })
    }
  }

  // Generate basal insulin todos
  if (basalSchedule) {
    for (let i = 0; i < basalSchedule.timesPerDay; i++) {
      const record = basalRecords[i]
      items.push({
        id: `basal-${i}`,
        insulinType: "basal",
        label: `Insulina Basal #${i + 1}`,
        dose: record?.dose ?? basalSchedule.unitsPerDose,
        completed: !!record,
        recordId: record?._id,
        administeredAt: record?.administeredAt,
      })
    }
  }

  return items
}

// Format time from timestamp
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function InsulinTodoList({
  rapidSchedule,
  basalSchedule,
  todayRecords,
  onLogDose,
  onUndoDose,
  isLogging = false,
  isDeleting = false,
}: InsulinTodoListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [undoDialogOpen, setUndoDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null)

  const todoItems = generateTodoItems(rapidSchedule, basalSchedule, todayRecords)
  const completedCount = todoItems.filter((t) => t.completed).length
  const totalCount = todoItems.length

  const isProcessing = isLogging || isDeleting

  const handleItemClick = (item: TodoItem) => {
    if (isProcessing) return

    if (item.completed && item.recordId) {
      // Open undo confirmation dialog
      setSelectedItem(item)
      setUndoDialogOpen(true)
    } else if (!item.completed) {
      // Open log dialog
      setSelectedItem(item)
      setDialogOpen(true)
    }
  }

  const handleConfirm = (data: { dose: number; administeredAt: Date }) => {
    if (!selectedItem) return
    onLogDose({
      insulinType: selectedItem.insulinType,
      dose: data.dose,
      administeredAt: data.administeredAt,
    })
    setDialogOpen(false)
    setSelectedItem(null)
  }

  const handleUndoConfirm = () => {
    if (!selectedItem?.recordId) return
    onUndoDose(selectedItem.recordId)
    setUndoDialogOpen(false)
    setSelectedItem(null)
  }

  if (totalCount === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Syringe className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Configura tu regimen de insulina</p>
          <p className="text-xs">para ver tus aplicaciones del dia</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-primary" />
              Aplicaciones de hoy
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{totalCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todoItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={isProcessing}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                item.completed
                  ? "bg-primary/10 border-primary/20 hover:bg-primary/15 hover:border-primary/30 cursor-pointer"
                  : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30 cursor-pointer",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Checkbox icon */}
              <div
                className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                  item.completed
                    ? "bg-primary text-primary-foreground"
                    : "border-2 border-muted-foreground/30"
                )}
              >
                {item.completed ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground/30" />
                )}
              </div>

              {/* Label and info */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium text-sm",
                    item.completed && "line-through text-muted-foreground"
                  )}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.dose} unidades
                  {item.completed && item.administeredAt && (
                    <span className="ml-2">
                      · {formatTime(item.administeredAt)}
                    </span>
                  )}
                </p>
              </div>

              {/* Type badge */}
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  item.insulinType === "rapid"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-purple-500/20 text-purple-400"
                )}
              >
                {item.insulinType === "rapid" ? "Rapida" : "Basal"}
              </span>
            </button>
          ))}

          {/* Progress indicator */}
          <div className="pt-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log dialog */}
      {selectedItem && !selectedItem.completed && (
        <InsulinLogDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          insulinType={selectedItem.insulinType}
          defaultDose={selectedItem.dose}
          onConfirm={handleConfirm}
          isLoading={isLogging}
        />
      )}

      {/* Undo confirmation dialog */}
      <AlertDialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deshacer registro</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem && (
                <>
                  ¿Quieres eliminar el registro de{" "}
                  <strong>{selectedItem.dose} unidades</strong> de insulina{" "}
                  {selectedItem.insulinType === "rapid" ? "rapida" : "basal"}
                  {selectedItem.administeredAt && (
                    <> registrado a las {formatTime(selectedItem.administeredAt)}</>
                  )}
                  ?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUndoConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
