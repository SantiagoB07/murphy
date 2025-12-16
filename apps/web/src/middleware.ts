import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isOnboardingRoute = createRouteMatcher(["/onboarding"])
const isApiROute = createRouteMatcher(["/api/(.*)", "/rpc(.*)", "/trpc(.*)"])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { isAuthenticated, sessionClaims } = await auth()

  if (isApiROute(req)) return NextResponse.next()

  // For users visiting /onboarding, don't try to redirect
  if (isAuthenticated && isOnboardingRoute(req)) {
    return NextResponse.next()
  }

  // if user is authenticated but hasn't completed onboarding, redirect to /onboarding
  if (isAuthenticated && !sessionClaims?.metadata?.role) {
    const onboardingUrl = new URL('/onboarding', req.url)
    return NextResponse.redirect(onboardingUrl)
  }

  // otherwise continue as normal
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

