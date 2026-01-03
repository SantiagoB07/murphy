import { Suspense } from "react"
import { getTranslations } from "next-intl/server"
import { LandingContent } from "./-components/LandingContent"

export default async function HomePage() {
  const t = await getTranslations("Landing")

  return (
    <>
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-hig"
      >
        {t("skipToContent")}
      </a>

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-pulse text-primary" aria-busy="true">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          </div>
        }
      >
        <LandingContent />
      </Suspense>
    </>
  )
}
