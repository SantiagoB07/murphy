import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import { MedicoLayout } from '@/components/medico/MedicoLayout';
import { ReportCard } from '@/components/medico/ReportCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import mockData from '@/data/mockPatients.json';
import { Patient, Doctor, AIReport } from '@/types/diabetes';

export default function MedicoInformes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientFilter = searchParams.get('patient') || 'all';

  const currentDoctor = mockData.doctors[0] as Doctor;
  
  const assignedPatients = useMemo(() => {
    return (mockData.patients as Patient[]).filter(
      patient => currentDoctor.patientIds.includes(patient.id)
    );
  }, [currentDoctor.patientIds]);

  const filteredReports = useMemo(() => {
    let reports = mockData.aiReports as AIReport[];
    
    // Only show reports for assigned patients
    reports = reports.filter(r => 
      currentDoctor.patientIds.includes(r.patientId)
    );

    // Apply patient filter
    if (patientFilter !== 'all') {
      reports = reports.filter(r => r.patientId === patientFilter);
    }

    // Sort by date (newest first)
    return reports.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }, [patientFilter, currentDoctor.patientIds]);

  const getPatientById = (id: string) => {
    return assignedPatients.find(p => p.id === id);
  };

  const handlePatientFilterChange = (value: string) => {
    if (value === 'all') {
      searchParams.delete('patient');
    } else {
      searchParams.set('patient', value);
    }
    setSearchParams(searchParams);
  };

  return (
    <MedicoLayout doctorName={currentDoctor.name}>
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
