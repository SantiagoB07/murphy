"use client"

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react"
import { SignInButton } from "@clerk/nextjs"
import Loader from "./loader"

interface AuthenticatedContentProps {
  children: React.ReactNode
  loadingFallback?: React.ReactNode
  unauthenticatedFallback?: React.ReactNode
}

/**
 * Wrapper component that ensures children only render when the user
 * is authenticated with Convex (not just Clerk). This is critical
 * for components that make authenticated Convex queries.
 * 
 * Use this instead of Clerk's SignedIn/SignedOut components when
 * making Convex queries that require authentication.
 */
export function AuthenticatedContent({
  children,
  loadingFallback,
  unauthenticatedFallback,
}: AuthenticatedContentProps) {
  return (
    <>
      <AuthLoading>
        {loadingFallback ?? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader />
          </div>
        )}
      </AuthLoading>
      <Authenticated>
        {children}
      </Authenticated>
      <Unauthenticated>
        {unauthenticatedFallback ?? (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4">
            <p className="text-muted-foreground">Please sign in to continue</p>
            <SignInButton mode="modal">
              <button className="btn-neon">Sign In</button>
            </SignInButton>
          </div>
        )}
      </Unauthenticated>
    </>
  )
}
