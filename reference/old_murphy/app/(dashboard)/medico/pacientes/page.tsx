"use client";

import { Users, Loader2 } from 'lucide-react';
import { MedicoLayout } from '@/app/components/medico/MedicoLayout';
import { PatientsDataTable } from '@/app/components/medico/PatientsDataTable';
import { usePatientsWithData } from '@/app/hooks/usePatients';

// Hardcoded doctor for now (no doctors table in Supabase)
const MOCK_DOCTOR = {
  id: 'd001',
  name: 'Dr. Alejandro Méndez',
  specialty: 'Endocrinología',
};

export default function MedicoPacientesPage() {
  // Fetch all patients with their data
  const { data: patients, isLoading } = usePatientsWithData();

  if (isLoading) {
    return (
      <MedicoLayout doctorName={MOCK_DOCTOR.name}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </MedicoLayout>
    );
  }

  const assignedPatients = patients ?? [];

  return (
    <MedicoLayout doctorName={MOCK_DOCTOR.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-hig-2xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-7 h-7 text-primary" />
              Mis Pacientes
            </h1>
            <p className="text-muted-foreground mt-1">
              {assignedPatients.length} pacientes asignados
            </p>
          </div>
        </div>

        {/* Patients Table */}
        <PatientsDataTable patients={assignedPatients} />
      </div>
    </MedicoLayout>
  );
}
