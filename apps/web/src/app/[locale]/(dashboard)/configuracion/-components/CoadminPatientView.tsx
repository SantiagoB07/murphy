"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { PatientDataForm } from "@/features/user"
import { ConfiguracionSkeleton } from "./ConfiguracionSkeleton"

export function CoadminPatientView() {
  const { data: profile, isPending } = useQuery(
    convexQuery(api.patients.getCurrentProfile, {})
  )

  if (isPending || !profile) {
    return <ConfiguracionSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Gestionando:{" "}
        <span className="font-medium text-foreground">{profile.fullName ?? "Paciente"}</span>
      </div>
      <PatientDataForm
        initialData={{
          fullName: profile.fullName ?? "",
          phoneNumber: profile.phoneNumber,
          diabetesType: profile.diabetesType,
          diagnosisYear: profile.diagnosisYear?.toString(),
          birthDate: profile.birthDate,
          gender: profile.gender,
          city: profile.city,
          estrato: profile.estrato?.toString(),
        }}
      />
    </div>
  )
}
