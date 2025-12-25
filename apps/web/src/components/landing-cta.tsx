import Link from "next/link"
import { ArrowRight, LogIn, UserPlus } from "lucide-react"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

import { auth } from "@clerk/nextjs/server"


export async function LandingCTA() {

  const session = await auth()
  const isAuthenticated = !!session.userId

  if (isAuthenticated) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
        <Link href="/dashboard">
          <Button size="lg" className="w-full sm:w-auto">
            <ArrowRight className="w-[var(--icon-sm)] h-[var(--icon-sm)]" />
            Ir al Dashboard
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
          Iniciar Sesión
        </Button>
      </SignInButton>
      <SignUpButton mode="redirect">
        <Button 
          variant="secondary" 
          size="lg" 
          className="w-full sm:w-auto"
        >
          <UserPlus className="w-[var(--icon-sm)] h-[var(--icon-sm)]" />
          Registrarte
        </Button>
      </SignUpButton>
    </div>
  )
}
