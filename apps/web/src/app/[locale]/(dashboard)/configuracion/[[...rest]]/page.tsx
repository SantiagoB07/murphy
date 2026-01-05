"use client"

import { UserProfile } from "@clerk/nextjs"
import { UserIcon, UsersIcon, HeartPulseIcon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useUserRole } from "@/features/user"
import { PatientSettingsView } from "../-components/PatientSettingsView"
import { CoadminPersonalView } from "../-components/CoadminPersonalView"
import { CoadminPatientView } from "../-components/CoadminPatientView"
import { CoadminPageContent } from "../-components/CoadminPageContent"
import { ConfiguracionSkeleton } from "../-components/ConfiguracionSkeleton"

function PatientUserProfile({
  t,
  basePath,
}: {
  t: (key: string) => string
  basePath: string
}) {
  return (
    <UserProfile path={basePath} routing="path">
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

function CoadminUserProfile({
  t,
  basePath,
}: {
  t: (key: string) => string
  basePath: string
}) {
  return (
    <UserProfile path={basePath} routing="path">
      <UserProfile.Page
        label={t("settingsItems.coadminProfile.label")}
        url="mi-perfil"
        labelIcon={<UserIcon className="w-4 h-4" />}
      >
        <CoadminPersonalView />
      </UserProfile.Page>

      <UserProfile.Page
        label={t("settingsItems.patientData.label")}
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
  const locale = useLocale()
  const { role, isLoading } = useUserRole()

  // Build path with locale prefix for non-default locales
  const basePath = locale === "es" ? "/configuracion" : `/${locale}/configuracion`


  if (isLoading) {
    return <ConfiguracionSkeleton />
  }

  if (role === "patient") {
    return <PatientUserProfile t={t} basePath={basePath} />
  }

  return <CoadminUserProfile t={t} basePath={basePath} />
}
