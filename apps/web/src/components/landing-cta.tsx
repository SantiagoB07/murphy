"use client"

import Link from "next/link"
import { ArrowRight, LogIn, UserPlus } from "lucide-react"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"

interface LandingCTAProps {
  isAuthenticated: boolean
}

export function LandingCTA({ isAuthenticated }: LandingCTAProps) {
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
      <SignInButton mode="modal">
        <Button 
          size="lg" 
          className="w-full sm:w-auto"
        >
          <LogIn className="w-[var(--icon-sm)] h-[var(--icon-sm)]" />
          Iniciar Sesión
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
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

export function LandingCTASkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up stagger-3">
      <div className="h-11 w-full sm:w-[180px] rounded-hig bg-secondary/50 animate-pulse" />
      <div className="h-11 w-full sm:w-[180px] rounded-hig bg-secondary/50 animate-pulse" />
    </div>
  )
}
