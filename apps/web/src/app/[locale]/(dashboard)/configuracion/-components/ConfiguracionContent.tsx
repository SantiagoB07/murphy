"use client"

import { useState } from "react"

import { User, ChevronRight, Users } from "lucide-react"

import { CoadminSheet } from "./CoadminSheet"
import { PersonalDataSheet } from "./PersonalDataSheet"

type SettingsSection = "personal" | "coadmin"

const settingsItems = [
  {
    key: "personal" as SettingsSection,
    icon: User,
    label: "Datos personales",
    description: "Nombre, email, fecha de nacimiento",
  },
  {
    key: "coadmin" as SettingsSection,
    icon: Users,
    label: "Coadministradores",
    description: "Familiares con acceso a tu cuenta",
  },
]

export function ConfiguracionContent() {
  const [openSheet, setOpenSheet] = useState<SettingsSection | null>(null)

  const handleOpenSheet = (section: SettingsSection) => {
    setOpenSheet(section)
  }

  const handleCloseSheet = () => {
    setOpenSheet(null)
  }

  return (
    <>
      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Ajustes generales</h2>
          <div className="grid gap-3">
            {settingsItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleOpenSheet(item.key)}
                className="glass-card p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors group min-h-[56px]"
                aria-label={`Abrir ${item.label}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <PersonalDataSheet
        open={openSheet === "personal"}
        onOpenChange={(open) => !open && handleCloseSheet()}
      />
      <CoadminSheet
        open={openSheet === "coadmin"}
        onOpenChange={(open) => !open && handleCloseSheet()}
      />
    </>
  )
}

