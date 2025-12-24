import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getUserState } from "@/lib/auth/getUserState"

const isOnboardingRoute = createRouteMatcher(["/onboarding", "/onboarding/coadmin"])
const isPatientOnboarding = createRouteMatcher(["/onboarding"])
const isCoadminOnboarding = createRouteMatcher(["/onboarding/coadmin"])
const isApiRoute = createRouteMatcher(["/api/(.*)", "/rpc(.*)", "/trpc(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isApiRoute(req)) return NextResponse.next()

  const userState = getUserState(await auth())

  // Unauthenticated users pass through (pages handle their own auth UI)
  if (userState.status === "unauthenticated") return NextResponse.next()

  // Onboarded users should not access onboarding routes
  if (userState.status === "onboarded" && isOnboardingRoute(req)) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Users needing onboarding must be on their correct flow
  if (userState.status === "needs-onboarding") {
    const correctRoute = userState.flow === "coadmin" ? "/onboarding/coadmin" : "/onboarding"
    const wrongRoute = userState.flow === "coadmin" ? isPatientOnboarding : isCoadminOnboarding

    if (wrongRoute(req) || !isOnboardingRoute(req)) {
      return NextResponse.redirect(new URL(correctRoute, req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc|rpc)(.*)",
  ],
}
