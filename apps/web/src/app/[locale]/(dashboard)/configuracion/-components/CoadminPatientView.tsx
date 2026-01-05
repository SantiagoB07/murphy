"use client"

import { useTranslations } from "next-intl"
import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { PatientDataForm } from "@/features/user"
import { ConfiguracionSkeleton } from "./ConfiguracionSkeleton"

export function CoadminPatientView() {
  const t = useTranslations("Configuracion.patientView")
  const { data: profile, isPending } = useQuery(
    convexQuery(api.patients.getCurrentProfile, {})
  )

  if (isPending || !profile) {
    return <ConfiguracionSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {t("managing")}{" "}
        <span className="font-medium text-foreground">{profile.fullName ?? t("patient")}</span>
      </div>
      <PatientDataForm
        initialData={{
          fullName: profile.fullName ?? "",
          phoneNumber: profile.phoneNumber,
          diabetesType: profile.diabetesType,
          diagnosisYear: profile.diagnosisYear?.toString(),
          age: profile.age,
          gender: profile.gender,
          city: profile.city,
          estrato: profile.estrato?.toString(),
        }}
      />
    </div>
  )
}
