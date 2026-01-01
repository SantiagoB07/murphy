"use client"

import { type ViewMode, VIEW_MODE_LABELS } from "@/features/glucose"
import { cn } from "@/lib/utils"

interface ViewModeSelectorProps {
  value: ViewMode
  onChange: (mode: ViewMode) => void
  disabled?: boolean
}

const VIEW_MODES: ViewMode[] = ["daily", "weekly", "monthly", "quarterly"]

export function ViewModeSelector({
  value,
  onChange,
  disabled,
}: ViewModeSelectorProps) {
  return (
    <div
      className="flex rounded-xl border border-border/50 overflow-hidden"
      role="tablist"
      aria-label="Selector de periodo de vista"
    >
      {VIEW_MODES.map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          disabled={disabled}
          role="tab"
          aria-selected={value === mode}
          aria-label={`Ver ${VIEW_MODE_LABELS[mode]}`}
          className={cn(
            "px-3 py-2 text-xs sm:text-sm font-medium transition-colors min-w-[60px] sm:min-w-[80px]",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset active:scale-[0.98]",
            value === mode
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {VIEW_MODE_LABELS[mode]}
        </button>
      ))}
    </div>
  )
}
