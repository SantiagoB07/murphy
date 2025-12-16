"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { InsulinSlotCard } from '@/app/components/insulin/InsulinSlotCard';
import { DailyLogInputDialog } from '@/app/components/daily-log/DailyLogInputDialog';
import { CreateAlertDialog } from '@/app/components/alerts/CreateAlertDialog';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { UserRole, TreatmentSlot, InsulinDose, InsulinType } from '@/app/types/diabetes';
import { type SupabaseAlert, type AlertChannel } from '@/app/lib/services/alerts';
import { usePatient } from '@/app/hooks/usePatients';
import { useInsulinLog } from '@/app/hooks/useInsulinLog';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, Loader2, Syringe, AlertCircle, Plus, Trash2, Bell, Phone, MessageCircle } from 'lucide-react';
import { isSameDay, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/app/lib/utils';

// Helper to get insulin type label based on hour
function getInsulinTypeLabel(hour: number): string {
  if (hour >= 21) return 'Basal';
  return 'Rápida';
}

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
  const { data: currentPatient, isLoading, isPending } = usePatient(patientId);
  const userName = currentPatient?.name ?? 'Cargando...';

  // Determine if we're in a loading state
  const isPageLoading = patientId !== null && (isLoading || isPending);

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

  // State for editing an insulin record
  const [editingInsulin, setEditingInsulin] = useState<InsulinDose | null>(null);
  
  // State for creating a new insulin record
  const [showCreateInsulin, setShowCreateInsulin] = useState(false);
  
  // State for alert dialog
  const [showCreateAlertDialog, setShowCreateAlertDialog] = useState(false);
  
  // State for alerts (loaded from Supabase)
  const [alerts, setAlerts] = useState<SupabaseAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  
  // Query client for refetching
  const queryClient = useQueryClient();

  // Get today's insulin records directly from patient data
  const todayInsulinRecords = useMemo(() => {
    if (!currentPatient?.insulina) return [];
    const today = new Date();
    return currentPatient.insulina
      .filter(i => isSameDay(parseISO(i.timestamp), today))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  }, [currentPatient?.insulina]);

  // Load alerts when patient changes
  useEffect(() => {
    async function loadAlerts() {
      if (!patientId) return;
      
      setAlertsLoading(true);
      try {
        const res = await fetch(`/api/alerts?patientId=${patientId}&alertType=insulin`);
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts ?? []);
        } else {
          console.error('Error loading alerts:', await res.text());
        }
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setAlertsLoading(false);
      }
    }
    
    loadAlerts();
  }, [patientId]);

  // Reload alerts helper
  const reloadAlerts = useCallback(async () => {
    if (!patientId) return;
    try {
      const res = await fetch(`/api/alerts?patientId=${patientId}&alertType=insulin`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }, [patientId]);

  // Handle create alert
  const handleCreateAlert = useCallback(async (scheduledTime: string, channel: AlertChannel) => {
    if (!patientId) return;

    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        alertType: 'insulin',
        scheduledTime,
        channel,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create alert');
    }

    await reloadAlerts();
  }, [patientId, reloadAlerts]);

  // Handle delete alert
  const handleDeleteAlert = useCallback(async (alertId: string) => {
    const res = await fetch(`/api/alerts/${alertId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      await reloadAlerts();
    } else {
      console.error('Error deleting alert:', await res.text());
    }
  }, [reloadAlerts]);

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

  const handleSaveRecord = (dose: number, time: string, variant: 'rapid' | 'basal') => {
    if (!selectedSlot) return;
    if (selectedSlot.record) {
      updateRecord(selectedSlot.record.id, dose);
    } else {
      addRecord(dose, variant);
    }
    setSelectedSlot(null);
  };

  // Handle creating a new insulin record
  const handleCreateInsulin = useCallback(async (dose: number, time: string, variant: 'rapid' | 'basal') => {
    if (!patientId) return;

    try {
      const res = await fetch('/api/insulin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          dose,
          time,
        }),
      });

      if (!res.ok) {
        console.error('Error creating insulin:', await res.text());
        return;
      }

      // Refetch patient data to update the UI
      await queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (error) {
      console.error('Error creating insulin:', error);
    } finally {
      setShowCreateInsulin(false);
    }
  }, [patientId, queryClient]);

  // Handle editing an insulin record
  const handleEditInsulin = useCallback(async (dose: number, time: string, variant: 'rapid' | 'basal') => {
    if (!editingInsulin) return;

    try {
      const res = await fetch(`/api/insulin/${editingInsulin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dose, time }),
      });

      if (!res.ok) {
        console.error('Error updating insulin:', await res.text());
        return;
      }

      // Refetch patient data to update the UI
      await queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (error) {
      console.error('Error updating insulin:', error);
    } finally {
      setEditingInsulin(null);
    }
  }, [editingInsulin, patientId, queryClient]);

  // Handle deleting an insulin record
  const handleDeleteInsulin = useCallback(async (insulinId: string) => {
    try {
      const res = await fetch(`/api/insulin/${insulinId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Error deleting insulin:', await res.text());
        return;
      }

      // Refetch patient data to update the UI
      await queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (error) {
      console.error('Error deleting insulin:', error);
    }
  }, [patientId, queryClient]);

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

  // No insulin slots configured - but still allow adding records
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

          {/* Alerts Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hig-base font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Mis alertas
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateAlertDialog(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>

            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-6 glass-card">
                <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No tienes alertas configuradas
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="glass-card p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-hig bg-primary/20 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {alert.scheduled_time.substring(0, 5)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {alert.channel === 'whatsapp' ? (
                            <>
                              <MessageCircle className="w-3 h-3" />
                              WhatsApp
                            </>
                          ) : (
                            <>
                              <Phone className="w-3 h-3" />
                              Llamada
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Insulin Records of the day */}
          <section className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hig-base font-semibold text-foreground flex items-center gap-2">
                <Syringe className="w-4 h-4" />
                Registros del día
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateInsulin(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </Button>
            </div>
            
            {todayInsulinRecords.length === 0 ? (
              <div className="text-center py-8 glass-card">
                <Syringe className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aún no hay registros hoy
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayInsulinRecords.map((insulin) => (
                  <div
                    key={insulin.id}
                    className="glass-card p-3 flex items-center justify-between"
                  >
                    <button
                      onClick={() => setEditingInsulin(insulin)}
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-hig bg-blue-500/20 flex items-center justify-center">
                        <Syringe className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(insulin.timestamp), 'HH:mm', { locale: es })} - {getInsulinTypeLabel(parseISO(insulin.timestamp).getHours())}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-foreground">
                          {insulin.dose}
                        </span>
                        <span className="text-xs text-muted-foreground">U</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteInsulin(insulin.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Edit Insulin Dialog */}
        {editingInsulin && (
          <DailyLogInputDialog
            open={!!editingInsulin}
            onOpenChange={(open) => !open && setEditingInsulin(null)}
            type="insulin"
            initialValue={editingInsulin.dose}
            initialTime={format(parseISO(editingInsulin.timestamp), 'HH:mm')}
            onSave={handleEditInsulin}
          />
        )}

        {/* Create Insulin Dialog */}
        <DailyLogInputDialog
          open={showCreateInsulin}
          onOpenChange={setShowCreateInsulin}
          type="insulin"
          onSave={handleCreateInsulin}
        />

        {/* Create Alert Dialog */}
        <CreateAlertDialog
          open={showCreateAlertDialog}
          onOpenChange={setShowCreateAlertDialog}
          alertType="insulin"
          onSubmit={handleCreateAlert}
        />
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

        {/* Alerts Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-hig-base font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Mis alertas
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateAlertDialog(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </Button>
          </div>

          {alertsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-6 glass-card">
              <Bell className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No tienes alertas configuradas
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="glass-card p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-hig bg-primary/20 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {alert.scheduled_time.substring(0, 5)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {alert.channel === 'whatsapp' ? (
                          <>
                            <MessageCircle className="w-3 h-3" />
                            WhatsApp
                          </>
                        ) : (
                          <>
                            <Phone className="w-3 h-3" />
                            Llamada
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteAlert(alert.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Insulin Records of the day */}
        <section className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-hig-base font-semibold text-foreground flex items-center gap-2">
              <Syringe className="w-4 h-4" />
              Registros del día
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateInsulin(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </Button>
          </div>
          
          {todayInsulinRecords.length === 0 ? (
            <div className="text-center py-8 glass-card">
              <Syringe className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Aún no hay registros hoy
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayInsulinRecords.map((insulin) => (
                <div
                  key={insulin.id}
                  className="glass-card p-3 flex items-center justify-between"
                >
                  <button
                    onClick={() => setEditingInsulin(insulin)}
                    className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-hig bg-blue-500/20 flex items-center justify-center">
                      <Syringe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(insulin.timestamp), 'HH:mm', { locale: es })}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {insulin.type === 'basal' ? 'Basal' : 'Rápida'}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-foreground">
                        {insulin.dose}
                      </span>
                      <span className="text-xs text-muted-foreground">U</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteInsulin(insulin.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          initialValue={selectedSlot.record?.dose ?? selectedSlot.slot.expectedDose ?? undefined}
          initialTime={selectedSlot.record ? format(parseISO(selectedSlot.record.timestamp), 'HH:mm') : undefined}
          onSave={handleSaveRecord}
        />
      )}

      {/* Edit Insulin Dialog */}
      {editingInsulin && (
        <DailyLogInputDialog
          open={!!editingInsulin}
          onOpenChange={(open) => !open && setEditingInsulin(null)}
          type="insulin"
          initialValue={editingInsulin.dose}
          initialTime={format(parseISO(editingInsulin.timestamp), 'HH:mm')}
          onSave={handleEditInsulin}
        />
      )}

      {/* Create Insulin Dialog */}
      <DailyLogInputDialog
        open={showCreateInsulin}
        onOpenChange={setShowCreateInsulin}
        type="insulin"
        onSave={handleCreateInsulin}
      />

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={showCreateAlertDialog}
        onOpenChange={setShowCreateAlertDialog}
        alertType="insulin"
        onSubmit={handleCreateAlert}
      />
    </DashboardLayout>
  );
}
