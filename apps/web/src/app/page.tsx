"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, ArrowRight, Zap, Shield, Stethoscope, type LucideIcon, Plus, LogIn, UserPlus } from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type UserRole = 'patient' | 'coadmin' | 'doctor';

interface RoleOption {
  role: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export default function HomePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const roles: RoleOption[] = [
    {
      role: 'patient',
      label: 'Paciente',
      description: 'Registra y visualiza tus glucometrías, sueño, insulina y más.',
      icon: Activity,
      color: 'from-purple-600 to-purple-400'
    },
    {
      role: 'coadmin',
      label: 'Co-administrador',
      description: 'Acompaña a un paciente en su seguimiento diario.',
      icon: Users,
      color: 'from-info to-cyan-400'
    },
    {
      role: 'doctor',
      label: 'Médico',
      description: 'Gestiona y da seguimiento a todos tus pacientes.',
      icon: Stethoscope,
      color: 'from-emerald-600 to-emerald-400'
    }
  ];


  const handleKeyDown = (e: React.KeyboardEvent, role: UserRole) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedRole(role);
    }
  };

  return (
    <div className="min-h-screen flex flex-col safe-area-inset">
      {/* Hero Background - HIG: reduced blur for performance */}
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

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-hig bg-gradient-purple flex items-center justify-center elevation-1">
              <Activity className="w-[var(--icon-lg)] h-[var(--icon-lg)] text-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-hig-lg text-foreground leading-hig-tight">MurphyIA</h1>
              <span className="text-hig-xs text-muted-foreground">Pro Edition</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
          <>
            <div className="max-w-4xl mx-auto text-center mb-12">
              {/* Title */}
              <h2 className="text-hig-3xl md:text-[clamp(2.5rem,5vw,4rem)] font-bold text-foreground mb-4 animate-fade-up leading-hig-tight">
                Tu salud,{' '}
                <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
                  bajo control
                </span>
              </h2>
              
              <p className="text-hig-lg md:text-hig-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up stagger-1 leading-hig-normal">
                Plataforma inteligente para el seguimiento de diabetes con integración WhatsApp 
                y análisis personalizado.
              </p>

              {/* Features */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-12 animate-fade-up stagger-2" role="list" aria-label="Características">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50" role="listitem">
                  <Zap className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-warning" aria-hidden="true" />
                  <span className="text-hig-sm text-muted-foreground">Tiempo real</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50" role="listitem">
                  <Shield className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-success" aria-hidden="true" />
                  <span className="text-hig-sm text-muted-foreground">Datos seguros</span>
                </div>
              </div>
            </div>

            {/* CTA Section */}
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
          </>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-hig-sm text-muted-foreground">
          <p>© 2024 MurphyIA</p>
          <p>Versión 1.0.0 - Beta</p>
        </div>
      </footer>
    </div>
  );
}

