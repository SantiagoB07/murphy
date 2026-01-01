import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import createIntlMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"
import { routing } from "./i18n/routing"
import { getUserState } from "@/lib/auth/getUserState"

const handleI18nRouting = createIntlMiddleware(routing)

// Routes with optional locale prefix pattern
const isOnboardingRoute = createRouteMatcher(["/onboarding", "/onboarding/coadmin", "/:locale/onboarding", "/:locale/onboarding/coadmin"])
const isPatientOnboarding = createRouteMatcher(["/onboarding", "/:locale/onboarding"])
const isCoadminOnboarding = createRouteMatcher(["/onboarding/coadmin", "/:locale/onboarding/coadmin"])
const isApiRoute = createRouteMatcher(["/api/(.*)", "/rpc(.*)", "/trpc(.*)"])

export default clerkMiddleware(async (auth, req) => {
  // Skip API routes from i18n handling
  if (isApiRoute(req)) return NextResponse.next()

  const userState = getUserState(await auth())

  // Unauthenticated users - just handle i18n routing
  if (userState.status === "unauthenticated") {
    return handleI18nRouting(req)
  }

  // Onboarded users should not access onboarding routes
  if (userState.status === "onboarded" && isOnboardingRoute(req)) {
    const response = handleI18nRouting(req)
    // Get the locale from the response or default
    const locale = response.headers.get("x-next-intl-locale") || routing.defaultLocale
    const redirectUrl = locale === routing.defaultLocale ? "/" : `/${locale}`
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }

  // Users needing onboarding must be on their correct flow
  if (userState.status === "needs-onboarding") {
    const correctPath = userState.flow === "coadmin" ? "/onboarding/coadmin" : "/onboarding"
    const wrongRoute = userState.flow === "coadmin" ? isPatientOnboarding : isCoadminOnboarding

    if (wrongRoute(req) || !isOnboardingRoute(req)) {
      // Run i18n middleware to get the locale
      const response = handleI18nRouting(req)
      const locale = response.headers.get("x-next-intl-locale") || routing.defaultLocale
      const redirectUrl = locale === routing.defaultLocale ? correctPath : `/${locale}${correctPath}`
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }
  }

  return handleI18nRouting(req)
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc|rpc)(.*)",
  ],
}
