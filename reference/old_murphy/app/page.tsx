"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Users, ArrowRight, Zap, Shield, Stethoscope, type LucideIcon, Plus } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { UserRole } from '@/app/types/diabetes';
import { getHomeRoute } from '@/app/lib/navigation';

import { PatientRegistrationForm } from '@/app/components/forms/PatientRegistrationForm';

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

  const handleContinue = () => {
    if (selectedRole) {
      const targetPath = getHomeRoute(selectedRole);
      // Store role in localStorage
      localStorage.setItem('userRole', selectedRole);
      router.push(targetPath);
    }
  };

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
        {showRegistrationForm ? (
          /* Registration Form */
          <PatientRegistrationForm onBack={() => setShowRegistrationForm(false)} />
        ) : (
          /* Role Selection View */
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

            {/* Role Selection */}
            <div className="w-full max-w-4xl mx-auto animate-fade-up stagger-3">
              <p className="text-center text-muted-foreground mb-6 text-hig-base" id="role-selection-label">
                Selecciona tu rol para continuar
              </p>
              
              <div 
                className="grid md:grid-cols-3 gap-4 mb-8"
                role="radiogroup"
                aria-labelledby="role-selection-label"
              >
                {roles.map(({ role, label, description, icon: Icon, color }) => (
                  <button
                    key={role}
                    role="radio"
                    aria-checked={selectedRole === role}
                    tabIndex={0}
                    onClick={() => setSelectedRole(role)}
                    onKeyDown={(e) => handleKeyDown(e, role)}
                    className={cn(
                      "glass-card p-6 text-left",
                      "transition-all duration-hig-fast ease-hig-out",
                      "hover:shadow-elevation-2 focus-ring press-feedback",
                      selectedRole === role && "ring-2 ring-primary elevation-2"
                    )}
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-hig-lg flex items-center justify-center mb-4",
                      "bg-gradient-to-br elevation-1",
                      color
                    )}>
                      <Icon className="w-7 h-7 text-foreground" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-hig-lg text-foreground mb-2 leading-hig-tight">{label}</h3>
                    <p className="text-hig-sm text-muted-foreground leading-hig-normal">{description}</p>
                  </button>
                ))}
              </div>

              {/* Patient Registration - only show for patient role */}
              {selectedRole === 'patient' && (
                <div className="mb-8 animate-fade-up">
                  <p className="text-center text-muted-foreground mb-4 text-hig-base">
                    Regístrate como nuevo paciente
                  </p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowRegistrationForm(true)}
                      className={cn(
                        "px-4 py-2 rounded-hig border transition-all flex items-center gap-2",
                        "border-dashed border-primary/50 bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                      Nuevo paciente
                    </button>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleContinue}
                  disabled={!selectedRole || selectedRole === 'patient'}
                  aria-disabled={!selectedRole || selectedRole === 'patient'}
                  className={cn(
                    "btn-neon flex items-center gap-2 px-8 py-4 text-hig-lg focus-ring",
                    (!selectedRole || selectedRole === 'patient') && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  Continuar
                  <ArrowRight className="w-[var(--icon-md)] h-[var(--icon-md)]" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
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
