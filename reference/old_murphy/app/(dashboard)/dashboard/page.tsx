"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { PatientCard } from '@/app/components/dashboard/PatientCard';
import { HabitTrackerCard } from '@/app/components/dashboard/HabitTrackerCard';
import { GlucoseChart } from '@/app/components/dashboard/GlucoseChart';
import { DailyLogInputDialog } from '@/app/components/daily-log/DailyLogInputDialog';
import { UserRole } from '@/app/types/diabetes';
import { usePatient } from '@/app/hooks/usePatients';
import { Activity, TrendingUp, Bell, Loader2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [patientId, setPatientId] = useState<string | null>(null);

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

  // Dialog states for wellness tracking
  const [sleepDialogOpen, setSleepDialogOpen] = useState(false);
  const [stressDialogOpen, setStressDialogOpen] = useState(false);
  const [dizzinessDialogOpen, setDizzinessDialogOpen] = useState(false);

  // Local state for wellness data (simplified)
  const [sleepData, setSleepData] = useState<{ hours: number } | null>(null);
  const [stressData, setStressData] = useState<boolean>(false);
  const [dizzinessData, setDizzinessData] = useState<boolean>(false);

  // Update local state when patient data loads
  useEffect(() => {
    if (currentPatient) {
      // Get today's sleep
      const today = new Date().toISOString().split('T')[0];
      const todaySleep = currentPatient.sueno.find(s => s.date === today);
      if (todaySleep) {
        setSleepData({ hours: todaySleep.hours });
      }
      // Get today's symptoms
      setStressData(currentPatient.hasStressToday ?? false);
      setDizzinessData(currentPatient.hasDizzinessToday ?? false);
    }
  }, [currentPatient]);

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

  const userName = currentPatient.name;

  // Stats cards data
  const stats = [
    {
      label: 'Última glucosa',
      value: `${currentPatient.glucometrias[0]?.value || '-'} mg/dL`,
      icon: Activity,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      label: 'Tendencia semanal',
      value: '-5.2%',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/20'
    },
    {
      label: 'Recordatorios activos',
      value: currentPatient.recordatorios.filter(r => r.enabled).length.toString(),
      icon: Bell,
      color: 'text-info',
      bgColor: 'bg-info/20'
    }
  ];

  // Wellness save handlers (simplified)
  const handleSaveSleep = (hours: number) => {
    setSleepData({ hours });
  };

  const handleSaveStress = (hasStress: boolean) => {
    setStressData(hasStress);
  };

  const handleSaveDizziness = (hasDizziness: boolean) => {
    setDizzinessData(hasDizziness);
  };

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-hig-2xl md:text-hig-3xl font-bold text-foreground mb-2 leading-hig-tight">
          Mi Dashboard
        </h1>
        <p className="text-muted-foreground text-hig-base leading-hig-normal">
          Bienvenido de vuelta. Aquí tienes tu resumen del día.
        </p>
      </header>

      {/* Stats Grid - 3 columns from tablet */}
      <section 
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        role="list"
        aria-label="Estadísticas principales"
      >
        {stats.map((stat, index) => (
          <article 
            key={stat.label}
            role="listitem"
            className="glass-card p-4 animate-fade-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-hig flex items-center justify-center",
                stat.bgColor
              )}>
                <stat.icon className={cn("w-[var(--icon-md)] h-[var(--icon-md)]", stat.color)} aria-hidden="true" />
              </div>
              <div>
                <p className="text-hig-xs text-muted-foreground">{stat.label}</p>
                <p className="text-hig-xl font-bold text-foreground leading-hig-tight">{stat.value}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Bienestar Diario - Full width, above the main grid */}
      <section className="mb-6">
        <HabitTrackerCard 
          sleepData={sleepData}
          stressData={stressData}
          dizzinessData={dizzinessData}
          onSleepClick={() => setSleepDialogOpen(true)}
          onStressClick={() => setStressDialogOpen(true)}
          onDizzinessClick={() => setDizzinessDialogOpen(true)}
        />
      </section>

      {/* Main content grid - responsive breakpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <GlucoseChart data={currentPatient.glucometrias} />
        
        {userRole === 'coadmin' && (
          <PatientCard patient={currentPatient} />
        )}
      </div>

      {/* Wellness Dialogs */}
      <DailyLogInputDialog
        open={sleepDialogOpen}
        onOpenChange={setSleepDialogOpen}
        type="sleep"
        initialHours={sleepData?.hours}
        onSave={handleSaveSleep}
      />

      <DailyLogInputDialog
        open={stressDialogOpen}
        onOpenChange={setStressDialogOpen}
        type="stress"
        initialValue={stressData}
        onSave={handleSaveStress}
      />

      <DailyLogInputDialog
        open={dizzinessDialogOpen}
        onOpenChange={setDizzinessDialogOpen}
        type="dizziness"
        initialValue={dizzinessData}
        onSave={handleSaveDizziness}
      />
    </DashboardLayout>
  );
}
