"use client"

import { OnboardingHeader } from "./-components/OnboardingHeader"
import { OnboardingForm } from "./-components/OnboardingForm"
import { OnboardingFooter } from "./-components/OnboardingFooter"

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex flex-col safe-area-inset">
      {/* Hero Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[60px]" />
      </div>

      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-hig"
      >
        Saltar al contenido principal
      </a>

      {/* Main Content */}
      <main id="main-content" className="relative z-10 flex-1 flex flex-col items-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto animate-fade-up">
          <OnboardingHeader />
          <OnboardingForm />
        </div>
      </main>

      <OnboardingFooter />
    </div>
  )
}
