"use client"

import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ViewMode } from "@/features/glucose"

interface GlucometriasHeaderProps {
  viewMode: ViewMode
}

export function GlucometriasHeader({ viewMode }: GlucometriasHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">
            Glucometrias
          </h1>
          <p className="text-muted-foreground text-base leading-normal">
            {viewMode === "daily"
              ? "Registro y edicion"
              : "Seguimiento y tendencias"}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10"
          aria-label="Compartir registros"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </div>
    </header>
  )
}

