"use client"

import { AuthenticatedContent } from "@/components/authenticated-content"
import { SignInButton } from "@clerk/nextjs"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthenticatedContent
      loadingFallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      }
      unauthenticatedFallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Murphy</h1>
            <p className="text-muted-foreground">
              Inicia sesión para acceder al dashboard
            </p>
            <SignInButton mode="modal">
              <button className="btn-neon px-6 py-2 rounded-xl">
                Iniciar Sesión
              </button>
            </SignInButton>
          </div>
        </div>
      }
    >
      {children}
    </AuthenticatedContent>
  )
}
