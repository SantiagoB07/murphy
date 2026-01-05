"use client"

import { UserProfile } from "@clerk/nextjs"
import { UserIcon, UsersIcon, HeartPulseIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useUserRole } from "@/features/user"
import { PatientSettingsView } from "../-components/PatientSettingsView"
import { CoadminPersonalView } from "../-components/CoadminPersonalView"
import { CoadminPatientView } from "../-components/CoadminPatientView"
import { CoadminPageContent } from "../-components/CoadminPageContent"
import { ConfiguracionSkeleton } from "../-components/ConfiguracionSkeleton"

function PatientUserProfile({ t }: { t: (key: string) => string }) {
  return (
    <UserProfile path="/configuracion" routing="path">
      <UserProfile.Page
        label={t("settingsItems.personal.label")}
        url="mis-datos"
        labelIcon={<UserIcon className="w-4 h-4" />}
      >
        <PatientSettingsView />
      </UserProfile.Page>

      <UserProfile.Page
        label={t("settingsItems.coadmin.label")}
        url="coadmins"
        labelIcon={<UsersIcon className="w-4 h-4" />}
      >
        <CoadminPageContent />
      </UserProfile.Page>

      <UserProfile.Page label="account" />
      <UserProfile.Page label="security" />
    </UserProfile>
  )
}

function CoadminUserProfile() {
  return (
    <UserProfile path="/configuracion" routing="path">
      <UserProfile.Page
        label="Mi Perfil"
        url="mi-perfil"
        labelIcon={<UserIcon className="w-4 h-4" />}
      >
        <CoadminPersonalView />
      </UserProfile.Page>

      <UserProfile.Page
        label="Datos del Paciente"
        url="paciente"
        labelIcon={<HeartPulseIcon className="w-4 h-4" />}
      >
        <CoadminPatientView />
      </UserProfile.Page>

      <UserProfile.Page label="account" />
      <UserProfile.Page label="security" />
    </UserProfile>
  )
}

export default function ConfiguracionPage() {
  const t = useTranslations("Configuracion")
  const { role, isLoading } = useUserRole()

  if (isLoading) {
    return <ConfiguracionSkeleton />
  }

  if (role === "patient") {
    return <PatientUserProfile t={t} />
  }

  return <CoadminUserProfile />
}
