"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk } from "@clerk/nextjs"
import { User, Bell, Shield, Smartphone, ChevronRight, LogOut } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/DashboardLayout"
import { PersonalDataSheet } from "./-components/PersonalDataSheet"
import { SecuritySheet } from "./-components/SecuritySheet"
import { NotificationsSheet } from "./-components/NotificationsSheet"
import { DevicesSheet } from "./-components/DevicesSheet"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type SettingsSection = "personal" | "security" | "notifications" | "devices"

const settingsItems = [
  {
    key: "personal" as SettingsSection,
    icon: User,
    label: "Datos personales",
    description: "Nombre, email, fecha de nacimiento",
  },
  {
    key: "security" as SettingsSection,
    icon: Shield,
    label: "Seguridad",
    description: "Contrasena y autenticacion",
  },
  {
    key: "notifications" as SettingsSection,
    icon: Bell,
    label: "Notificaciones",
    description: "Alertas y recordatorios",
  },
  {
    key: "devices" as SettingsSection,
    icon: Smartphone,
    label: "Dispositivos",
    description: "Glucometros conectados",
  },
]

export default function ConfiguracionPage() {
  const router = useRouter()
  const { user } = useUser()
  const { signOut } = useClerk()
  const userName = user?.firstName || "Usuario"
  const [openSheet, setOpenSheet] = useState<SettingsSection | null>(null)

  const handleOpenSheet = (section: SettingsSection) => {
    setOpenSheet(section)
  }

  const handleCloseSheet = () => {
    setOpenSheet(null)
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success("Sesion cerrada", {
        description: "Has cerrado sesion correctamente",
      })
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Error", {
        description: "No se pudo cerrar la sesion",
      })
    }
  }

  return (
    <DashboardLayout userName={userName} userRole="patient">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu cuenta y preferencias
          </p>
        </div>

        {/* General Settings */}
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

        {/* Logout Section */}
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Sesion</h2>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar sesion</span>
          </Button>
        </section>
      </div>

      {/* Sheets */}
      <PersonalDataSheet
        open={openSheet === "personal"}
        onOpenChange={(open) => !open && handleCloseSheet()}
      />
      <SecuritySheet
        open={openSheet === "security"}
        onOpenChange={(open) => !open && handleCloseSheet()}
      />
      <NotificationsSheet
        open={openSheet === "notifications"}
        onOpenChange={(open) => !open && handleCloseSheet()}
      />
      <DevicesSheet
        open={openSheet === "devices"}
        onOpenChange={(open) => !open && handleCloseSheet()}
      />
    </DashboardLayout>
  )
}
