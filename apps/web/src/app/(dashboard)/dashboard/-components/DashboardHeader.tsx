"use client"

interface DashboardHeaderProps {
  userName?: string
}

export function DashboardHeader({ userName = "Usuario" }: DashboardHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 leading-tight">
            Mi Dashboard
          </h1>
          <p className="text-muted-foreground text-base leading-normal">
            Bienvenido de vuelta
            {userName ? `, ${userName}` : ""}. Aquí tienes tu resumen del día.
          </p>
        </div>
      </div>
    </header>
  )
}

