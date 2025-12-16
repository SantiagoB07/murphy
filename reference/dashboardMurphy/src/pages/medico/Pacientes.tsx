import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { MedicoLayout } from '@/components/medico/MedicoLayout';
import { PatientsDataTable } from '@/components/medico/PatientsDataTable';
import mockData from '@/data/mockPatients.json';
import { Patient, Doctor } from '@/types/diabetes';

export default function MedicoPacientes() {
  // Get the current doctor's patients (simulated - using first doctor)
  const currentDoctor = mockData.doctors[0] as Doctor;
  
  const assignedPatients = useMemo(() => {
    return (mockData.patients as Patient[]).filter(
      patient => currentDoctor.patientIds.includes(patient.id)
    );
  }, [currentDoctor.patientIds]);

  return (
    <MedicoLayout doctorName={currentDoctor.name}>
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
