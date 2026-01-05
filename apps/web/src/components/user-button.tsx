"use client"

import { UserButton as ClerkUserButton } from "@clerk/nextjs"

interface UserButtonProps {
  afterSignOutUrl?: string
}

export function UserButton({ afterSignOutUrl = "/" }: UserButtonProps) {
  return (
    <ClerkUserButton
      userProfileMode="navigation"
      userProfileUrl="/configuracion"
      afterSignOutUrl={afterSignOutUrl}
    />
  )
}
