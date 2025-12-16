"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { User, ChevronRight, Loader2 } from 'lucide-react';
import { UserRole } from '@/app/types/diabetes';
import { usePatient } from '@/app/hooks/usePatients';
import { PersonalDataSheet } from '@/app/components/settings/PersonalDataSheet';

export default function ConfiguracionPage() {
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [patientId, setPatientId] = useState<string | null>(null);
  const [openPersonalData, setOpenPersonalData] = useState(false);

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
  const { data: currentPatient, isLoading, refetch } = usePatient(patientId);
  const userName = currentPatient?.name ?? 'Cargando...';

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

        {/* Settings */}
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Ajustes generales</h2>
          <div className="grid gap-3">
            <button
              onClick={() => setOpenPersonalData(true)}
              className="glass-card p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors group"
              aria-label="Abrir datos personales"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Datos personales</p>
                <p className="text-sm text-muted-foreground">Nombre, teléfono, información médica</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </section>
      </div>

      {/* Personal Data Sheet */}
      <PersonalDataSheet 
        open={openPersonalData} 
        onOpenChange={setOpenPersonalData}
        patient={currentPatient}
        onSave={() => refetch()}
      />
    </DashboardLayout>
  );
}
