"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { User, Bell, Shield, Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import { UserRole } from '@/app/types/diabetes';
import { usePatient } from '@/app/hooks/usePatients';
import { PersonalDataSheet } from '@/app/components/settings/PersonalDataSheet';
import { SecuritySheet } from '@/app/components/settings/SecuritySheet';
import { NotificationsSheet } from '@/app/components/settings/NotificationsSheet';
import { DevicesSheet } from '@/app/components/settings/DevicesSheet';

type SettingsSection = 'personal' | 'security' | 'notifications' | 'devices';

const settingsItems = [
  { 
    key: 'personal' as SettingsSection, 
    icon: User, 
    label: 'Datos personales', 
    description: 'Nombre, email, fecha de nacimiento' 
  },
  { 
    key: 'security' as SettingsSection, 
    icon: Shield, 
    label: 'Seguridad', 
    description: 'Contraseña y autenticación' 
  },
  { 
    key: 'notifications' as SettingsSection, 
    icon: Bell, 
    label: 'Notificaciones', 
    description: 'Alertas y recordatorios' 
  },
  { 
    key: 'devices' as SettingsSection, 
    icon: Smartphone, 
    label: 'Dispositivos', 
    description: 'Glucómetros conectados' 
  },
];

export default function ConfiguracionPage() {
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState<SettingsSection | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedPatientId = localStorage.getItem('murphy-patient-id');
    if (storedRole) {
      setUserRole(storedRole);
    }
    if (storedPatientId) {
      setPatientId(storedPatientId);
    }
  }, []);

  // Fetch patient data from Supabase
  const { data: currentPatient, isLoading } = usePatient(patientId);
  const userName = currentPatient?.name ?? 'Cargando...';

  const handleOpenSheet = (section: SettingsSection) => {
    setOpenSheet(section);
  };

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  // Loading state
  if (isLoading || !currentPatient) {
    return (
      <DashboardLayout userRole={userRole} userName="Cargando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu cuenta y preferencias</p>
        </div>

        {/* General Settings */}
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Ajustes generales</h2>
          <div className="grid gap-3">
            {settingsItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleOpenSheet(item.key)}
                className="glass-card p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors group"
                aria-label={`Abrir ${item.label}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Sheets */}
      <PersonalDataSheet 
        open={openSheet === 'personal'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
      <SecuritySheet 
        open={openSheet === 'security'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
      <NotificationsSheet 
        open={openSheet === 'notifications'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
      <DevicesSheet 
        open={openSheet === 'devices'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
    </DashboardLayout>
  );
}
