"use client"

import { Zap, Shield, LogIn, Calendar as CalendarIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

interface HeroSectionProps {
  onScrollToContact: () => void
}

export function HeroSection({ onScrollToContact }: HeroSectionProps) {
  const t = useTranslations("Landing")

  return (
    <section className="min-h-screen flex items-center justify-center px-4 pt-20">
      <div className="text-center max-w-3xl mx-auto animate-fade-up">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
          {t("hero.title")} <span className="text-primary">{t("hero.titleHighlight")}</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("hero.description")}
        </p>

        <div className="flex items-center justify-center gap-4 mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            {t("features.realTime")}
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            {t("features.secureData")}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignInButton mode="redirect">
            <Button variant="outline" size="lg" className="w-full sm:w-auto min-w-[160px]">
              <LogIn className="mr-2 h-4 w-4" />
              {t("cta.signIn")}
            </Button>
          </SignInButton>
          <Button
            onClick={onScrollToContact}
            size="lg"
            className="btn-neon w-full sm:w-auto min-w-[160px]"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {t("cta.scheduleDemo")}
          </Button>
        </div>
      </div>
    </section>
  )
}
