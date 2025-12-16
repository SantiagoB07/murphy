"use client"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav"
import { TopNavbar } from "@/components/navigation/TopNavbar"
import { Activity } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
  userName?: string
}

export function DashboardLayout({ children, userName = "Usuario" }: DashboardLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-foreground" aria-hidden="true" />
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
          "transition-all duration-300 ease-out",
          isMobile && "pb-20"
        )}
        id="main-content"
      >
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  )
}
