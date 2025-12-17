"use client"

import { AuthenticatedContent } from "@/components/authenticated-content"
import { SignInButton, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav"
import { TopNavbar } from "@/components/navigation/TopNavbar"
import { Activity } from "lucide-react"

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
      <DashboardShell>{children}</DashboardShell>
    </AuthenticatedContent>
  )
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useUser()
  const isMobile = useIsMobile()
  const userName = user?.firstName || "Usuario"

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-card border-b border-border/50 px-4 safe-area-inset">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-hig bg-gradient-purple flex items-center justify-center">
              <Activity className="w-[var(--icon-md)] h-[var(--icon-md)] text-foreground" aria-hidden="true" />
            </div>
            <span className="font-semibold text-foreground">Murphy</span>
          </div>
        </div>
      </header>

      {/* Desktop/Tablet Top Navbar */}
      <TopNavbar userName={userName} />

      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen pt-14",
          "transition-all duration-hig-slow ease-hig-out",
          isMobile && "pb-20"
        )}
        id="main-content"
      >
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  )
}
