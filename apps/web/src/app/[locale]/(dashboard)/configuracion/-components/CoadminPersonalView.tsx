"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { CoadminProfileForm } from "@/features/user"
import { ConfiguracionSkeleton } from "./ConfiguracionSkeleton"

export function CoadminPersonalView() {
  const { data: profile, isPending } = useQuery(
    convexQuery(api.coadmins.getCoadminOwnProfile, {})
  )

  if (isPending || !profile) {
    return <ConfiguracionSkeleton />
  }

  return (
    <CoadminProfileForm
      initialData={{
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber ?? "",
      }}
    />
  )
}
