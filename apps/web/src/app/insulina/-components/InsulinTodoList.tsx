"use client"

import { useState } from "react"
import { Check, Circle, Syringe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { InsulinSchedule } from "@/types/diabetes"
import type { InsulinDoseRecord } from "@/hooks/useInsulinDoseRecords"
import { InsulinLogDialog } from "./InsulinLogDialog"

interface TodoItem {
  id: string
  insulinType: "rapid" | "basal"
  label: string
  dose: number
  completed: boolean
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
  isLogging?: boolean
}

// Generate todo items based on schedules and today's completed records
function generateTodoItems(
  rapidSchedule: InsulinSchedule | null,
  basalSchedule: InsulinSchedule | null,
  todayRecords: InsulinDoseRecord[]
): TodoItem[] {
  const items: TodoItem[] = []

  // Count completed doses by type
  const rapidCompleted = todayRecords.filter((r) => r.insulinType === "rapid").length
  const basalCompleted = todayRecords.filter((r) => r.insulinType === "basal").length

  // Generate rapid insulin todos
  if (rapidSchedule) {
    for (let i = 0; i < rapidSchedule.timesPerDay; i++) {
      items.push({
        id: `rapid-${i}`,
        insulinType: "rapid",
        label: `Insulina Rapida #${i + 1}`,
        dose: rapidSchedule.unitsPerDose,
        completed: i < rapidCompleted,
      })
    }
  }

  // Generate basal insulin todos
  if (basalSchedule) {
    for (let i = 0; i < basalSchedule.timesPerDay; i++) {
      items.push({
        id: `basal-${i}`,
        insulinType: "basal",
        label: `Insulina Basal #${i + 1}`,
        dose: basalSchedule.unitsPerDose,
        completed: i < basalCompleted,
      })
    }
  }

  return items
}

export function InsulinTodoList({
  rapidSchedule,
  basalSchedule,
  todayRecords,
  onLogDose,
  isLogging = false,
}: InsulinTodoListProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<TodoItem | null>(null)

  const todoItems = generateTodoItems(rapidSchedule, basalSchedule, todayRecords)
  const completedCount = todoItems.filter((t) => t.completed).length
  const totalCount = todoItems.length

  const handleItemClick = (item: TodoItem) => {
    if (item.completed) return // Already completed
    setSelectedItem(item)
    setDialogOpen(true)
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
              disabled={item.completed || isLogging}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                item.completed
                  ? "bg-primary/10 border-primary/20 cursor-default"
                  : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-primary/30 cursor-pointer",
                isLogging && !item.completed && "opacity-50"
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
      {selectedItem && (
        <InsulinLogDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          insulinType={selectedItem.insulinType}
          defaultDose={selectedItem.dose}
          onConfirm={handleConfirm}
          isLoading={isLogging}
        />
      )}
    </>
  )
}
