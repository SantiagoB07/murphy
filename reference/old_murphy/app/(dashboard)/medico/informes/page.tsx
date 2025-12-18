"use client";

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileText, Plus, Loader2 } from 'lucide-react';
import { MedicoLayout } from '@/app/components/medico/MedicoLayout';
import { ReportCard } from '@/app/components/medico/ReportCard';
import { Button } from '@/app/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { usePatientsWithData } from '@/app/hooks/usePatients';
import { AIReport } from '@/app/types/diabetes';

// Hardcoded doctor for now (no doctors table in Supabase)
const MOCK_DOCTOR = {
  id: 'd001',
  name: 'Dr. Alejandro Méndez',
  specialty: 'Endocrinología',
};

// Generate mock reports based on real patient data
function generateMockReports(patients: { id: string; glucometrias: { value: number }[] }[]): AIReport[] {
  return patients.map(patient => {
    const glucValues = patient.glucometrias.map(g => g.value);
    if (glucValues.length === 0) return null;
    
    const avg = Math.round(glucValues.reduce((a, b) => a + b, 0) / glucValues.length);
    const stdDev = Math.round(Math.sqrt(
      glucValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / glucValues.length
    ));
    const hypoCount = glucValues.filter(v => v < 70).length;
    const hyperCount = glucValues.filter(v => v > 180).length;
    const inRange = glucValues.filter(v => v >= 70 && v <= 180).length;
    const timeInRange = Math.round((inRange / glucValues.length) * 100);
    
    let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
    if (timeInRange > 80) trend = 'improving';
    else if (timeInRange < 50) trend = 'deteriorating';

    const recommendations: string[] = [];
    if (hyperCount > 3) recommendations.push('Revisar dosis de insulina');
    if (hypoCount > 0) recommendations.push('Cuidado con hipoglucemias');
    if (timeInRange > 80) recommendations.push('Excelente control, mantener régimen');
    if (recommendations.length === 0) recommendations.push('Continuar monitoreo regular');

    return {
      id: `report-${patient.id}`,
      patientId: patient.id,
      generatedAt: new Date().toISOString(),
      summary: {
        avgGlucose: avg,
        stdDev,
        hypoCount,
        hyperCount,
        timeInRange,
        trend,
      },
      recommendations,
    };
  }).filter(Boolean) as AIReport[];
}

function MedicoInformesContent() {
  const searchParams = useSearchParams();
  const [patientFilter, setPatientFilter] = useState(searchParams.get('patient') || 'all');

  // Fetch all patients with their data
  const { data: patients, isLoading } = usePatientsWithData();
  const assignedPatients = patients ?? [];

  // Generate reports from real patient data
  const allReports = useMemo(() => {
    return generateMockReports(assignedPatients);
  }, [assignedPatients]);

  const filteredReports = useMemo(() => {
    let reports = allReports;

    // Apply patient filter
    if (patientFilter !== 'all') {
      reports = reports.filter(r => r.patientId === patientFilter);
    }

    // Sort by date (newest first)
    return reports.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }, [patientFilter, allReports]);

  const getPatientById = (id: string) => {
    return assignedPatients.find(p => p.id === id);
  };

  const handlePatientFilterChange = (value: string) => {
    setPatientFilter(value);
  };

  if (isLoading) {
    return (
      <MedicoLayout doctorName={MOCK_DOCTOR.name}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </MedicoLayout>
    );
  }

  return (
    <MedicoLayout doctorName={MOCK_DOCTOR.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-hig-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-7 h-7 text-primary" />
              Informes
            </h1>
            <p className="text-muted-foreground mt-1">
              {filteredReports.length} informes generados
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Informe
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={patientFilter} onValueChange={handlePatientFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por paciente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los pacientes</SelectItem>
              {assignedPatients.map(patient => (
                <SelectItem key={patient.id} value={patient.id}>
                  {patient.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="grid gap-4 md:grid-cols-2">
          {filteredReports.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              patient={getPatientById(report.patientId)}
            />
          ))}
        </div>

        {filteredReports.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {patientFilter !== 'all' 
                ? 'No hay informes para este paciente.'
                : 'No hay informes generados aún.'
              }
            </p>
            <Button variant="outline" className="mt-4 gap-2">
              <Plus className="w-4 h-4" />
              Crear primer informe
            </Button>
          </div>
        )}
      </div>
    </MedicoLayout>
  );
}

export default function MedicoInformesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <MedicoInformesContent />
    </Suspense>
  );
}
