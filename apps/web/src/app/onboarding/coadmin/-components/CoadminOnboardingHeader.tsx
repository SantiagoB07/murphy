import { Activity, UserPlus } from "lucide-react"

export function CoadminOnboardingHeader() {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-hig bg-gradient-purple flex items-center justify-center elevation-1">
          <Activity className="w-[var(--icon-lg)] h-[var(--icon-lg)] text-foreground" aria-hidden="true" />
        </div>
        <div>
          <h1 className="font-bold text-hig-lg text-foreground leading-hig-tight">MurphyIA</h1>
          <span className="text-hig-xs text-muted-foreground">Pro Edition</span>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-6 h-6 text-primary" />
        <h2 className="text-hig-xl md:text-hig-2xl font-bold text-foreground">Registro de Coadministrador</h2>
      </div>
      <p className="text-hig-sm text-muted-foreground">
        Completa tus datos para acceder a la cuenta del paciente
      </p>
    </div>
  )
}

