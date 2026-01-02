"use client"

import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ThemeProvider } from "./theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { clerkAppearance } from "@/lib/clerkAppearance"
import { getClerkLocalization } from "@/lib/clerkLocalization"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const convexQueryClient = new ConvexQueryClient(convex)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
})
convexQueryClient.connect(queryClient)

interface BaseProvidersProps {
  children: React.ReactNode
  locale: string
}

export default function BaseProviders({ children, locale }: BaseProvidersProps) {
  const localization = getClerkLocalization(locale)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkProvider appearance={clerkAppearance} localization={localization}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
      <Toaster richColors />
    </ThemeProvider>
  )
}
