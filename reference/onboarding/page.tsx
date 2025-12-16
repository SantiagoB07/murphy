"use client"

import { OnboardingHeader } from "./-components/OnboardingHeader"
import { OnboardingForm } from "./-components/OnboardingForm"
import { OnboardingFooter } from "./-components/OnboardingFooter"

export default function OnboardingPage() {
  return (
    <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-pink-50 via-orange-50 to-rose-50 dark:from-pink-950/20 dark:via-orange-950/20 dark:to-rose-950/20">
      <div className="container mx-auto min-h-full px-4 py-12 md:py-20">
        <div className="mx-auto max-w-2xl">
          <OnboardingHeader />
          <OnboardingForm />
          <OnboardingFooter />
        </div>
      </div>
    </div>
  )
}
