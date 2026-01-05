"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { PatientDataForm } from "@/features/user"

export function CoadminPatientView() {
  const { data: profile, isPending } = useQuery(
    convexQuery(api.patients.getCurrentProfile, {})
  )

  return (
    <div className="space-y-6">
      {!isPending && profile && (
        <div className="text-sm text-muted-foreground">
          Gestionando:{" "}
          <span className="font-medium text-foreground">{profile.fullName}</span>
        </div>
      )}
      <PatientDataForm />
    </div>
  )
}
