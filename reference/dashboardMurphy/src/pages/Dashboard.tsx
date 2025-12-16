import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PatientCard } from '@/components/dashboard/PatientCard';
import { HabitTrackerCard } from '@/components/dashboard/HabitTrackerCard';
import { XPDonut } from '@/components/dashboard/XPDonut';
import { GlucoseChart } from '@/components/dashboard/GlucoseChart';
import { WellnessHistorySheet } from '@/components/wellness/WellnessHistorySheet';

import { DailyLogInputDialog } from '@/components/daily-log/DailyLogInputDialog';
import { useXPCalculation } from '@/hooks/useXPCalculation';
import { useWellnessLog } from '@/hooks/useWellnessLog';
import { useGlucoseLog } from '@/hooks/useGlucoseLog';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Patient, DizzinessSymptom, Glucometry } from '@/types/diabetes';
import mockData from '@/data/mockPatients.json';
import { Activity, TrendingUp, Flame, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isSameDay } from 'date-fns';

export default function Dashboard() {
  const location = useLocation();
  const { userRole: authRole, profile, isDemoMode, demoRole, patientProfile } = useAuth();
  
  // Use auth role if available, fallback to location state for demo mode compatibility
  const userRole: UserRole = authRole || demoRole || (location.state?.role as UserRole) || 'patient';

  // Dialog states for wellness tracking
  const [sleepDialogOpen, setSleepDialogOpen] = useState(false);
  const [stressDialogOpen, setStressDialogOpen] = useState(false);
  const [dizzinessDialogOpen, setDizzinessDialogOpen] = useState(false);
  const [historyType, setHistoryType] = useState<'sleep' | 'stress' | 'dizziness' | null>(null);

  // Wellness data from Supabase
  const { 
    todaySleep, 
    todayStress, 
    todayDizziness, 
    saveSleep, 
    saveStress, 
    saveDizziness,
    sleepHistory,
    stressHistory,
    dizzinessHistory
  } = useWellnessLog(patientProfile?.id);

  // Real glucose data from Supabase (only when authenticated)
  const patientId = !isDemoMode && patientProfile?.id ? patientProfile.id : undefined;
  const { records: realRecords, todayRecords: realTodayRecords } = useGlucoseLog(patientId);

  // Get mock data for demo mode
  const patients = mockData.patients as Patient[];
  
  // For demo, use first patient as current user
  const currentPatient = patients[0];
  
  // Get user name from auth profile or mock data
  const userName = profile?.full_name || (
    userRole === 'coadmin' 
      ? mockData.coadmins[0].name 
      : currentPatient.name
  );

  // Get today's glucose records (real data when authenticated, mock for demo)
  const todayGlucoseRecords = useMemo(() => {
    if (patientId && realTodayRecords.size > 0) {
      return Array.from(realTodayRecords.values());
    }
    const today = new Date();
    return (currentPatient.glucometrias as Glucometry[]).filter(record => 
      isSameDay(new Date(record.timestamp), today)
    );
  }, [patientId, realTodayRecords, currentPatient.glucometrias]);

  // Calculate XP using the hook
  const xpResult = useXPCalculation({
    todayGlucoseRecords,
    hasSleepLogged: !!todaySleep,
    hasStressLogged: !!todayStress,
    streakDays: currentPatient.streak,
    totalAccumulatedXP: currentPatient.xpLevel * 10,
  });

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
      label: 'Días en racha',
      value: `${currentPatient.streak}`,
      icon: Flame,
      color: 'text-warning',
      bgColor: 'bg-warning/20'
    },
    {
      label: 'Alertas activas',
      value: currentPatient.alertas.filter(a => !a.resolved).length.toString(),
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/20'
    }
  ];

  // Wellness save handlers
  const handleSaveSleep = (hours: number, quality?: number) => {
    saveSleep({ hours, quality: quality ?? 5 });
  };

  const handleSaveStress = (level: number, notes?: string) => {
    saveStress({ level, notes });
  };

  const handleSaveDizziness = (severity: number, symptoms?: DizzinessSymptom[], notes?: string) => {
    saveDizziness({ severity, symptoms, notes });
  };

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-hig-2xl md:text-hig-3xl font-bold text-foreground mb-2 leading-hig-tight">
          Mi Dashboard
        </h1>
        <p className="text-muted-foreground text-hig-base leading-hig-normal">
          Bienvenido de vuelta{userName ? `, ${userName.split(' ')[0]}` : ''}. Aquí tienes tu resumen del día.
        </p>
      </header>

      {/* Stats Grid - 4 columns from tablet */}
      <section 
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
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
          sleepData={todaySleep}
          stressData={todayStress}
          dizzinessData={todayDizziness}
          onSleepClick={() => setSleepDialogOpen(true)}
          onStressClick={() => setStressDialogOpen(true)}
          onDizzinessClick={() => setDizzinessDialogOpen(true)}
          onViewHistory={(type) => setHistoryType(type)}
        />
      </section>

      {/* Main content grid - responsive breakpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts & Data (full on mobile, half on tablet, 2/3 on desktop) */}
        <div className="md:col-span-1 lg:col-span-2 space-y-6">
          <GlucoseChart data={patientId ? realRecords : currentPatient.glucometrias} />
          
          {userRole === 'coadmin' && (
            <PatientCard patient={currentPatient} />
          )}
        </div>

        {/* Right Column - XP (full on mobile, half on tablet, 1/3 on desktop) */}
        <div className="md:col-span-1 lg:col-span-1 space-y-6">
          <XPDonut 
            totalXP={xpResult.levelInfo.currentLevelXP + (xpResult.levelInfo.level - 1) * 300}
            todayXP={xpResult.finalXP}
            currentLevelXP={xpResult.levelInfo.currentLevelXP}
            nextLevelThreshold={xpResult.levelInfo.nextLevelThreshold}
            streak={xpResult.streakDays}
            levelTitle={xpResult.levelInfo.title}
            streakMultiplier={xpResult.streakMultiplier}
            slotsToday={xpResult.slotsCompleted}
            progressPercent={xpResult.levelInfo.progressPercent}
          />
        </div>
      </div>

      {/* Wellness Dialogs */}
      <DailyLogInputDialog
        open={sleepDialogOpen}
        onOpenChange={setSleepDialogOpen}
        type="sleep"
        initialHours={todaySleep?.hours}
        initialQuality={todaySleep?.quality}
        onSave={handleSaveSleep}
      />

      <DailyLogInputDialog
        open={stressDialogOpen}
        onOpenChange={setStressDialogOpen}
        type="stress"
        initialLevel={todayStress?.level}
        onSave={handleSaveStress}
      />

      <DailyLogInputDialog
        open={dizzinessDialogOpen}
        onOpenChange={setDizzinessDialogOpen}
        type="dizziness"
        initialSeverity={todayDizziness?.severity}
        onSave={handleSaveDizziness}
      />

      {/* Wellness History Sheet */}
      <WellnessHistorySheet
        open={historyType !== null}
        onOpenChange={(open) => !open && setHistoryType(null)}
        type={historyType ?? 'sleep'}
        data={
          historyType === 'sleep' ? sleepHistory :
          historyType === 'stress' ? stressHistory :
          dizzinessHistory
        }
      />
    </DashboardLayout>
  );
}
