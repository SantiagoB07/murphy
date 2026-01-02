import { Link } from "@/i18n/navigation"
import { ArrowRight, LogIn, UserPlus } from "lucide-react"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { auth } from "@clerk/nextjs/server"

export async function LandingCTA() {
  const t = await getTranslations("Landing.cta")
  const session = await auth()
  const isAuthenticated = !!session.userId

  if (isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto">
            <ArrowRight className="w-[var(--icon-sm)] h-[var(--icon-sm)]" />
            {t("goToDashboard")}
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
      <SignInButton mode="redirect">
        <Button 
          size="lg" 
          className="w-full sm:w-auto"
        >
          <LogIn className="w-[var(--icon-sm)] h-[var(--icon-sm)]" />
          {t("signIn")}
        </Button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full sm:w-auto"
        >
          <UserPlus className="w-[var(--icon-sm)] h-[var(--icon-sm)]" />
          {t("signUp")}
        </Button>
      </SignUpButton>
    </div>
  )
}
