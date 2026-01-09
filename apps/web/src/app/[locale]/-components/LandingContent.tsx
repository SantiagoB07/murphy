"use client"

import { useCallback } from "react"
import { LandingHeader } from "./LandingHeader"
import { HeroSection } from "./HeroSection"
import { VideoSection } from "./VideoSection"
import { ProblemSection } from "./ProblemSection"
import { SolutionSection } from "./SolutionSection"
import { BenefitsSection } from "./BenefitsSection"
import { LandingFooter } from "./LandingFooter"

export function LandingContent() {
  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader onScrollToSection={scrollToSection} />

      <HeroSection />

      <VideoSection />

      {/* Problem & Solution Section */}
      <section id="problema" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <ProblemSection />
            <SolutionSection />
          </div>
        </div>
      </section>

      <BenefitsSection />

      <LandingFooter />
    </div>
  )
}
