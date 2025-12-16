import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Moon, 
  Brain, 
  Syringe,
  Flame,
  Target,
  TrendingUp,
  FileText,
  Save
} from 'lucide-react';
import { MedicoLayout } from '@/components/medico/MedicoLayout';
import { GlucoseChart } from '@/components/dashboard/GlucoseChart';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import mockData from '@/data/mockPatients.json';
import { Patient, Doctor, GLUCOSE_RANGES } from '@/types/diabetes';
import { toast } from 'sonner';

export default function MedicoPacienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctorNotes, setDoctorNotes] = useState('');

  const currentDoctor = mockData.doctors[0] as Doctor;
  const patient = useMemo(() => {
    return (mockData.patients as Patient[]).find(p => p.id === id);
  }, [id]);

  if (!patient) {
    return (
      <MedicoLayout doctorName={currentDoctor.name}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Paciente no encontrado</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/medico/pacientes')}
            className="mt-4"
          >
            Volver a la lista
          </Button>
        </div>
      </MedicoLayout>
    );
  }

  // Calculate stats
  const latestGlucose = patient.glucometrias.length > 0
    ? patient.glucometrias.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0]
    : null;

  const inRangeCount = patient.glucometrias.filter(
    g => g.value >= GLUCOSE_RANGES.low && g.value <= GLUCOSE_RANGES.high
  ).length;
  const timeInRange = patient.glucometrias.length > 0
    ? Math.round((inRangeCount / patient.glucometrias.length) * 100)
    : 0;

  const avgGlucose = patient.glucometrias.length > 0
    ? Math.round(patient.glucometrias.reduce((sum, g) => sum + g.value, 0) / patient.glucometrias.length)
    : 0;

  const latestSleep = patient.sueno.length > 0
    ? patient.sueno.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  const latestStress = patient.estres.length > 0
    ? patient.estres.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null;

  const activeAlerts = patient.alertas.filter(a => !a.resolved).length;

  const handleSaveNotes = () => {
    toast.success('Notas guardadas correctamente');
  };

  const handleGenerateReport = () => {
    navigate(`/medico/informes?patient=${patient.id}`);
  };

  return (
    <MedicoLayout doctorName={currentDoctor.name}>
      <div className="space-y-6">
        {/* Header with Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/medico/pacientes')}
              className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a pacientes
            </Button>
            <h1 className="text-hig-2xl font-bold text-foreground">{patient.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{patient.diabetesType}</Badge>
              <span className="text-muted-foreground">{patient.age} años</span>
              {activeAlerts > 0 && (
                <Badge variant="destructive">{activeAlerts} alertas</Badge>
              )}
            </div>
          </div>
          <Button onClick={handleGenerateReport} className="gap-2">
            <FileText className="w-4 h-4" />
            Generar Informe
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Última Glucosa</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {latestGlucose ? `${latestGlucose.value}` : '—'}
                <span className="text-sm font-normal text-muted-foreground ml-1">mg/dL</span>
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-success" />
                <span className="text-sm text-muted-foreground">En Rango</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {timeInRange}%
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-info" />
                <span className="text-sm text-muted-foreground">Promedio</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {avgGlucose}
                <span className="text-sm font-normal text-muted-foreground ml-1">mg/dL</span>
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-warning" />
                <span className="text-sm text-muted-foreground">Racha</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {patient.streak}
                <span className="text-sm font-normal text-muted-foreground ml-1">días</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Glucose Chart - Spans 2 columns */}
          <div className="lg:col-span-2">
            <GlucoseChart 
              data={patient.glucometrias}
              showTargetRange={true}
            />
          </div>

          {/* Wellness Summary */}
          <div className="space-y-4">
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Bienestar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-info" />
                    <span className="text-sm text-muted-foreground">Sueño</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {latestSleep ? `${latestSleep.hours}h` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-warning" />
                    <span className="text-sm text-muted-foreground">Estrés</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {latestStress ? `${latestStress.level}/10` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">Insulina</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {patient.insulina.length > 0 
                      ? `${patient.insulina[patient.insulina.length - 1].units}u` 
                      : '—'
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Notes */}
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas del Médico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Escribe observaciones sobre este paciente..."
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button 
                  size="sm" 
                  onClick={handleSaveNotes}
                  disabled={!doctorNotes.trim()}
                  className="w-full gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar Notas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MedicoLayout>
  );
}
