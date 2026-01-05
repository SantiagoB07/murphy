"use client"

import { UserProfile } from "@clerk/nextjs"
import { UserIcon, UsersIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { PersonalDataPageContent } from "../-components/PersonalDataPageContent"
import { CoadminPageContent } from "../-components/CoadminPageContent"

export default function ConfiguracionPage() {
  const t = useTranslations("Configuracion")

  return (
    <UserProfile path="/configuracion" routing="path">
      {/* Custom pages first */}
      <UserProfile.Page
        label={t("settingsItems.personal.label")}
        url="personal-data"
        labelIcon={<UserIcon className="w-4 h-4" />}
      >
        <PersonalDataPageContent />
      </UserProfile.Page>

      <UserProfile.Page
        label={t("settingsItems.coadmin.label")}
        url="coadmins"
        labelIcon={<UsersIcon className="w-4 h-4" />}
      >
        <CoadminPageContent />
      </UserProfile.Page>

      {/* Reorder default Clerk pages after custom ones */}
      <UserProfile.Page label="account" />
      <UserProfile.Page label="security" />
    </UserProfile>
  )
}
