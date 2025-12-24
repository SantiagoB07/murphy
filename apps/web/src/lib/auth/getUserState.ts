import type { auth } from "@clerk/nextjs/server"

type AuthResult = Awaited<ReturnType<typeof auth>>

export type UserState =
  | { status: "unauthenticated" }
  | { status: "onboarded"; role: "patient" | "coadmin" | "doctor" }
  | { status: "needs-onboarding"; flow: "patient" | "coadmin" }

export function getUserState(authResult: AuthResult): UserState {
  if (!authResult.userId) return { status: "unauthenticated" }

  const metadata = authResult.sessionClaims?.metadata

  if (metadata?.role) {
    return { status: "onboarded", role: metadata.role }
  }

  return {
    status: "needs-onboarding",
    flow: metadata?.intendedRole === "coadmin" ? "coadmin" : "patient",
  }
}

