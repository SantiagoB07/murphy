"use client";

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { InsulinSlotCard } from '@/app/components/insulin/InsulinSlotCard';
import { DailyLogInputDialog } from '@/app/components/daily-log/DailyLogInputDialog';
import { Card, CardContent } from '@/app/components/ui/card';
import { UserRole, TreatmentSlot, InsulinDose, InsulinType } from '@/app/types/diabetes';
import { usePatient } from '@/app/hooks/usePatients';
import { useInsulinLog } from '@/app/hooks/useInsulinLog';
import { Activity, Loader2, Syringe, AlertCircle } from 'lucide-react';
import { isSameDay, parseISO } from 'date-fns';

export default function InsulinaPage() {
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
  const { data: currentPatient, isLoading, isFetching } = usePatient(patientId);
  const userName = currentPatient?.name ?? 'Cargando...';

  // Determine if we're in a loading state (either fetching or waiting for patientId)
  const isPageLoading = isFetching || (patientId !== null && isLoading);

  // Get insulin slots from treatment schedule
  const insulinSlots = useMemo(() => {
    if (!currentPatient?.treatmentSchedule) return [];
    return currentPatient.treatmentSchedule
      .filter(slot => slot.type === 'insulin' && slot.enabled)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [currentPatient?.treatmentSchedule]);

  // Initialize hook with existing patient insulin data
  const { 
    addRecord, 
    updateRecord, 
    getSlotRecord 
  } = useInsulinLog(currentPatient?.insulina ?? []);

  // Selected slot for dialog
  const [selectedSlot, setSelectedSlot] = useState<{
    slot: TreatmentSlot;
    record?: InsulinDose;
  } | null>(null);

  // Get today's records for each slot
  const todaySlotRecords = useMemo(() => {
    const records = new Map<string, InsulinDose>();
    insulinSlots.forEach(slot => {
      const record = getSlotRecord(slot);
      if (record) {
        records.set(slot.id, record);
      }
    });
    return records;
  }, [insulinSlots, getSlotRecord]);

  // Calculate today's stats
  const todayStats = useMemo(() => {
    const appliedCount = todaySlotRecords.size;
    const totalSlots = insulinSlots.length;
    const totalUnits = Array.from(todaySlotRecords.values())
      .reduce((sum, record) => sum + record.dose, 0);
    
    const expectedUnits = insulinSlots
      .reduce((sum, slot) => sum + (slot.expectedDose || 0), 0);

    return {
      appliedCount,
      totalSlots,
      totalUnits,
      expectedUnits,
      percentComplete: totalSlots > 0 ? Math.round((appliedCount / totalSlots) * 100) : 0
    };
  }, [todaySlotRecords, insulinSlots]);

  const handleSlotClick = (slot: TreatmentSlot) => {
    const record = todaySlotRecords.get(slot.id);
    setSelectedSlot({ slot, record });
  };

  const handleSaveRecord = (dose: number, notes?: string) => {
    if (!selectedSlot) return;

    const insulinType = selectedSlot.slot.insulinType as InsulinType || 'rapid';
    
    if (selectedSlot.record) {
      updateRecord(selectedSlot.record.id, dose, notes);
    } else {
      addRecord(dose, insulinType, notes);
    }
    setSelectedSlot(null);
  };

  // Loading state
  if (isPageLoading) {
    return (
      <DashboardLayout userRole={userRole} userName="Cargando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // No patient selected - prompt to select one
  if (!currentPatient) {
    return (
      <DashboardLayout userRole={userRole} userName="Sin paciente">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Syringe className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-2">No hay paciente seleccionado</p>
          <p className="text-sm text-muted-foreground">
            Vuelve a la página de inicio para seleccionar tu perfil.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // No insulin slots configured
  if (insulinSlots.length === 0) {
    return (
      <DashboardLayout userRole={userRole} userName={userName}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Insulina</h1>
            <p className="text-muted-foreground mt-1">
              Registro de aplicación de insulina
            </p>
          </div>

          <Card className="bg-muted/20 border-border/30">
            <CardContent className="py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h2 className="font-medium text-foreground mb-2">
                Sin horarios de insulina configurados
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm">
                Tu régimen de insulina aún no ha sido configurado. 
                Contacta a tu médico para establecer los horarios y dosis.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Insulina</h1>
          <p className="text-muted-foreground mt-1">
            Registra tus aplicaciones de insulina
          </p>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <article className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Syringe className="w-4 h-4 text-primary" />
              <span className="text-hig-xs text-muted-foreground">Aplicaciones</span>
            </div>
            <p className="text-hig-xl font-bold text-foreground">
              {todayStats.appliedCount}/{todayStats.totalSlots}
            </p>
          </article>
          
          <article className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-info" />
              <span className="text-hig-xs text-muted-foreground">Unidades hoy</span>
            </div>
            <p className="text-hig-xl font-bold text-foreground">
              {todayStats.totalUnits} <span className="text-hig-xs font-normal text-muted-foreground">U</span>
            </p>
          </article>

          <article className="glass-card p-4">
            <span className="text-hig-xs text-muted-foreground">Esperado</span>
            <p className="text-hig-xl font-bold text-muted-foreground">
              {todayStats.expectedUnits} <span className="text-hig-xs font-normal">U</span>
            </p>
          </article>

          <article className="glass-card p-4">
            <span className="text-hig-xs text-muted-foreground">Completado</span>
            <p className="text-hig-xl font-bold text-success">
              {todayStats.percentComplete}%
            </p>
          </article>
        </div>

        {/* Insulin Slots */}
        <section className="space-y-3">
          <h2 className="text-hig-base font-semibold text-foreground mb-4">
            Aplicaciones del día
          </h2>
          
          {insulinSlots.map((slot, index) => (
            <div 
              key={slot.id}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <InsulinSlotCard
                slot={slot}
                record={todaySlotRecords.get(slot.id)}
                onClick={() => handleSlotClick(slot)}
              />
            </div>
          ))}
        </section>

        {/* Summary card */}
        {todayStats.appliedCount > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progreso de hoy</p>
                  <p className="font-medium">
                    {todayStats.appliedCount} de {todayStats.totalSlots} aplicaciones · {todayStats.totalUnits} unidades aplicadas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Input Dialog */}
      {selectedSlot && (
        <DailyLogInputDialog
          open={!!selectedSlot}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
          type="insulin"
          variant={selectedSlot.slot.insulinType === 'basal' ? 'basal' : 'rapid'}
          initialValue={selectedSlot.record?.dose ?? selectedSlot.slot.expectedDose ?? undefined}
          onSave={handleSaveRecord}
        />
      )}
    </DashboardLayout>
  );
}
