"use client"

import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { getMobileNavItems } from "@/lib/navigation"

export function MobileBottomNav() {
  const pathname = usePathname()
  const navItems = getMobileNavItems()

  const isActive = (path: string) => pathname === path

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]"
      role="navigation"
      aria-label="Navegacion principal"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="flex items-center justify-center -mt-4"
              >
                <div className="tiktok-button">
                  <div className="tiktok-button-inner w-14 h-10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-background" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[56px] py-2 px-1",
                "transition-colors duration-150 ease-out",
                "min-h-[44px] active:scale-95",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform duration-150",
                  active && "scale-110"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active && "text-primary"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
