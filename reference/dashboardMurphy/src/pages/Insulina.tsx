import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { InsulinConfigCard } from '@/components/insulin/InsulinConfigCard';
import { InsulinUpdateSheet } from '@/components/insulin/InsulinUpdateSheet';
import { InsulinHistoryTable } from '@/components/insulin/InsulinHistoryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useInsulinSchedule, UpdateInsulinData } from '@/hooks/useInsulinSchedule';
import { toast } from 'sonner';

export default function Insulina() {
  const { patientProfile, coadminProfile, userRole, profile, isDemoMode } = useAuth();
  
  // Determine patientId based on user role
  const patientId = useMemo(() => {
    if (isDemoMode) return null;
    if (userRole === 'coadmin' && coadminProfile) {
      return coadminProfile.patient_id;
    }
    return patientProfile?.id || null;
  }, [userRole, coadminProfile, patientProfile, isDemoMode]);

  const {
    rapidSchedule,
    basalSchedule,
    history,
    isLoading,
    updateSchedule,
    isUpdating,
  } = useInsulinSchedule(patientId);

  const [updateSheetOpen, setUpdateSheetOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'rapid' | 'basal'>('rapid');

  const handleOpenUpdate = (type: 'rapid' | 'basal') => {
    setSelectedType(type);
    setUpdateSheetOpen(true);
  };

  const handleSaveUpdate = (data: UpdateInsulinData) => {
    updateSchedule(
      { insulinType: selectedType, data },
      {
        onSuccess: () => {
          toast.success(
            `${selectedType === 'rapid' ? 'Insulina rápida' : 'Insulina basal'} actualizada`
          );
          setUpdateSheetOpen(false);
        },
        onError: (error) => {
          toast.error('Error al guardar: ' + error.message);
        },
      }
    );
  };

  const totalDailyUnits =
    (rapidSchedule ? rapidSchedule.timesPerDay * rapidSchedule.unitsPerDose : 0) +
    (basalSchedule ? basalSchedule.timesPerDay * basalSchedule.unitsPerDose : 0);

  const totalApplications =
    (rapidSchedule?.timesPerDay ?? 0) + (basalSchedule?.timesPerDay ?? 0);

  const userName = profile?.full_name || 'Usuario';

  // Demo mode fallback
  if (isDemoMode) {
    return (
      <DashboardLayout userRole={userRole || 'patient'} userName={userName}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Insulina</h1>
            <p className="text-muted-foreground mt-1">
              Modo demo - Inicia sesión para gestionar tu insulina
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={userRole || 'patient'} userName={userName}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insulina</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tu régimen de insulina rápida y basal
          </p>
        </div>

        {/* Config cards */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-[280px]" />
            <Skeleton className="h-[280px]" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <InsulinConfigCard
              type="rapid"
              schedule={rapidSchedule}
              onUpdate={() => handleOpenUpdate('rapid')}
            />
            <InsulinConfigCard
              type="basal"
              schedule={basalSchedule}
              onUpdate={() => handleOpenUpdate('basal')}
            />
          </div>
        )}

        {/* Summary card */}
        {totalDailyUnits > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resumen diario</p>
                  <p className="font-medium">
                    {totalApplications} aplicaciones · {totalDailyUnits} unidades totales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Historial de ajustes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <InsulinHistoryTable history={history} />
            )}
          </CardContent>
        </Card>

        {/* Update sheet */}
        <InsulinUpdateSheet
          open={updateSheetOpen}
          onOpenChange={setUpdateSheetOpen}
          type={selectedType}
          currentSchedule={selectedType === 'rapid' ? rapidSchedule : basalSchedule}
          onSave={handleSaveUpdate}
          isLoading={isUpdating}
        />
      </div>
    </DashboardLayout>
  );
}
