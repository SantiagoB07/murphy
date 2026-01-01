"use client"

import { useUser } from "@clerk/nextjs"
import { DashboardHeader } from "./-components/DashboardHeader"
import { DashboardContent } from "./-components/DashboardContent"

export default function DashboardPage() {
  const { user } = useUser()
  const userName = user?.firstName || "Usuario"

  return (
    <>
      <DashboardHeader userName={userName} />
      <DashboardContent />
    </>
  )
}
