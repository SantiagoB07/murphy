"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { Settings, Activity } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { getNavItems, getHomeRoute, getSettingsRoute } from "@/lib/navigation"
import { LocaleSwitcher } from "@/components/LocaleSwitcher"

interface TopNavbarProps {
  userName: string
}

export function TopNavbar({ userName }: TopNavbarProps) {
  const pathname = usePathname()
  const navItems = getNavItems()
  const homeRoute = getHomeRoute()
  const settingsRoute = getSettingsRoute()

  const isActive = (path: string) => pathname === path

  return (
    <header
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-lg border-b border-border/50"
      role="banner"
    >
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={homeRoute as "/dashboard"}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Activity className="w-5 h-5 text-foreground" aria-hidden="true" />
          </div>
          <span className="font-semibold text-foreground text-base">
            Murphy
          </span>
        </Link>

        {/* Navigation */}
        <nav
          className="flex items-center gap-1"
          role="navigation"
          aria-label="Navegacion principal"
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href as "/dashboard"}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl",
                  "transition-colors duration-150 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                  "min-h-[44px]",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon
                  className={cn("w-4 h-4", active && "text-primary")}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    active && "text-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* User & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Locale Switcher */}
          <LocaleSwitcher />

          {/* Settings Button */}
          <Link
            href={settingsRoute as "/configuracion"}
            aria-label="Configuracion"
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-xl",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
              isActive(settingsRoute)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Settings className="w-5 h-5" aria-hidden="true" />
          </Link>

          {/* User Button */}
          <div className="pl-3 border-l border-border/50">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  )
}
