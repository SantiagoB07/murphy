import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isPatientOnboardingRoute = createRouteMatcher(["/onboarding"])
const isCoadminOnboardingRoute = createRouteMatcher(["/onboarding/coadmin"])
const isAnyOnboardingRoute = createRouteMatcher(["/onboarding", "/onboarding/coadmin"])
const isApiRoute = createRouteMatcher(["/api/(.*)", "/rpc(.*)", "/trpc(.*)"])

interface ClerkMetadata {
  role?: "patient" | "coadmin"
  intendedRole?: "coadmin"
  invitedByPatientId?: string
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { isAuthenticated, sessionClaims } = await auth()

  // Skip middleware for API routes
  if (isApiRoute(req)) return NextResponse.next()

  // For users already on any onboarding route, don't redirect
  if (isAuthenticated && isAnyOnboardingRoute(req)) {
    return NextResponse.next()
  }

  if (isAuthenticated) {
    const metadata = sessionClaims?.metadata as ClerkMetadata | undefined
    const role = metadata?.role
    const intendedRole = metadata?.intendedRole

    // User has completed onboarding (has a role)
    if (role) {
      return NextResponse.next()
    }

    // User was invited as a coadmin but hasn't completed onboarding
    if (intendedRole === "coadmin") {
      const coadminOnboardingUrl = new URL('/onboarding/coadmin', req.url)
      return NextResponse.redirect(coadminOnboardingUrl)
    }

    // User has no role and wasn't invited as coadmin - regular patient onboarding
    const onboardingUrl = new URL('/onboarding', req.url)
    return NextResponse.redirect(onboardingUrl)
  }

  // Not authenticated - continue as normal
  return NextResponse.next()
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc|rpc)(.*)',
  ],
};
