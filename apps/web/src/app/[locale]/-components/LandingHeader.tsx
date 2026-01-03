"use client"

import { Activity } from "lucide-react"
import { useTranslations } from "next-intl"
import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LocaleSwitcher } from "@/components/LocaleSwitcher"

interface LandingHeaderProps {
  onScrollToSection: (id: string) => void
}

export function LandingHeader({ onScrollToSection }: LandingHeaderProps) {
  const t = useTranslations("Landing")

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary">{t("brand.name")}</span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onScrollToSection("problema")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {t("nav.problema")}
          </button>
          <button
            onClick={() => onScrollToSection("solucion")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {t("nav.solucion")}
          </button>
          <button
            onClick={() => onScrollToSection("beneficios")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {t("nav.beneficios")}
          </button>
          <button
            onClick={() => onScrollToSection("contacto")}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {t("nav.contacto")}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <SignInButton mode="redirect">
            <Button variant="ghost" className="hidden sm:inline-flex">
              {t("cta.signIn")}
            </Button>
          </SignInButton>
          <Button onClick={() => onScrollToSection("contacto")} className="btn-neon">
            {t("cta.scheduleDemo")}
          </Button>
        </div>
      </div>
    </header>
  )
}
