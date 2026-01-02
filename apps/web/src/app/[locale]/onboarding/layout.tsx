import { auth } from "@clerk/nextjs/server"
import { redirect } from "@/i18n/navigation"
import { getLocale } from "next-intl/server"

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session.isAuthenticated) {
    const locale = await getLocale()
    redirect({ href: "/", locale })
  }

  return <>{children}</>
}
