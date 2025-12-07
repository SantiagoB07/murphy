"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { GlucoseSlotCard } from '@/app/components/glucose/GlucoseSlotCard';
import { GlucoseTreatmentSlotCard } from '@/app/components/glucose/GlucoseTreatmentSlotCard';
import { CreateAlertDialog } from '@/app/components/alerts/CreateAlertDialog';
import { DailyLogInputDialog } from '@/app/components/daily-log/DailyLogInputDialog';
import { ViewModeSelector } from '@/app/components/glucose/ViewModeSelector';
import { WeeklyView } from '@/app/components/glucose/WeeklyView';
import { MonthlyView } from '@/app/components/glucose/MonthlyView';
import { QuarterlyView } from '@/app/components/glucose/QuarterlyView';
import { Button } from '@/app/components/ui/button';
import { Calendar } from '@/app/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useGlucoseLog } from '@/app/hooks/useGlucoseLog';
import { usePatient } from '@/app/hooks/usePatients';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Glucometry, 
  GlucometryType, 
  MEAL_TIME_SLOTS, 
  TreatmentSlot,
  UserRole,
  ViewMode,
  getTimeSlotIcon
} from '@/app/types/diabetes';
import { inferGlucometryType } from '@/app/lib/mappers/patient';
import { type SupabaseAlert, type AlertChannel } from '@/app/lib/services/alerts';
import { cn } from '@/app/lib/utils';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, parseISO, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Share2, TrendingUp, Activity, Loader2, Bell, Plus, Phone, MessageCircle, Trash2, Droplets } from 'lucide-react';

// Helper to match a record to a treatment slot based on time window
function recordMatchesSlot(record: Glucometry, slot: TreatmentSlot): boolean {
  const recordHour = parseISO(record.timestamp).getHours();
  const slotHour = parseInt(slot.scheduledTime.split(':')[0], 10);
  
  // Allow 1 hour before and 2 hours after scheduled time
  return recordHour >= Math.max(0, slotHour - 1) && recordHour <= Math.min(23, slotHour + 2);
}

// Helper to get meal time label based on hour (Colombian schedule)
function getMealTimeLabel(hour: number): string {
  if (hour < 7) return 'Antes del desayuno';
  if (hour < 12) return 'Después del desayuno';
  if (hour < 14) return 'Antes del almuerzo';
  if (hour < 19) return 'Después del almuerzo';
  if (hour < 21) return 'Antes de la cena';
  return 'Después de la cena';
}

export default function GlucometriasPage() {
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedPatientId = localStorage.getItem('murphy-patient-id');
    console.log('[Glucometrias] localStorage:', { storedRole, storedPatientId });
    if (storedRole) {
      setUserRole(storedRole);
    }
    if (storedPatientId) {
      setPatientId(storedPatientId);
    }
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  // Calculate daysBack based on view mode for efficient data loading
  const daysBack = useMemo(() => {
    switch (viewMode) {
      case 'quarterly':
        return 120; // ~4 months for quarterly view
      case 'monthly':
        return 60;  // ~2 months for monthly navigation
      case 'weekly':
      case 'daily':
      default:
        return 30;  // 1 month for daily/weekly
    }
  }, [viewMode]);

  // Fetch patient data from Supabase with dynamic daysBack
  const { data: currentPatient, isLoading, isPending, status } = usePatient(patientId, daysBack);
  const userName = currentPatient?.name ?? 'Cargando...';
  
  console.log('[Glucometrias] Query state:', { patientId, daysBack, isLoading, isPending, status, hasPatient: !!currentPatient });
  
  // Determine if we're in a loading state
  const isPageLoading = patientId !== null && (isLoading || isPending);

  // State for selected slot - can be either TreatmentSlot or legacy type
  const [selectedSlot, setSelectedSlot] = useState<{
    treatmentSlot?: TreatmentSlot;
    legacyType?: GlucometryType;
    record?: Glucometry;
  } | null>(null);

  // State for alert dialog
  const [showCreateAlertDialog, setShowCreateAlertDialog] = useState(false);
  
  // State for alerts (loaded from Supabase)
  const [alerts, setAlerts] = useState<SupabaseAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // State for editing a glucometry record
  const [editingGlucometry, setEditingGlucometry] = useState<Glucometry | null>(null);
  
  // State for creating a new glucometry record
  const [showCreateGlucometry, setShowCreateGlucometry] = useState(false);
  
  // Query client for refetching
  const queryClient = useQueryClient();

  // Load alerts when patient changes
  useEffect(() => {
    async function loadAlerts() {
      if (!patientId) return;
      
      setAlertsLoading(true);
      try {
        const res = await fetch(`/api/alerts?patientId=${patientId}&alertType=glucometry`);
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
      const res = await fetch(`/api/alerts?patientId=${patientId}&alertType=glucometry`);
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
        alertType: 'glucometry',
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

  // Get glucose slots from treatment schedule
  const glucoseSlots = useMemo(() => {
    if (!currentPatient?.treatmentSchedule) return [];
    return currentPatient.treatmentSchedule
      .filter(slot => slot.type === 'glucose' && slot.enabled)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [currentPatient?.treatmentSchedule]);

  // Determine if we should use treatment schedule or fallback to MEAL_TIME_SLOTS
  const useTreatmentSlots = glucoseSlots.length > 0;

  // Initialize hook with existing patient data
  const { 
    records, 
    addRecord, 
    updateRecord, 
    getRecordsByDate,
    getRecordsInRange 
  } = useGlucoseLog(currentPatient?.glucometrias ?? []);

  // Get today's glucometries directly from patient data (refreshed every 30s)
  const todayGlucometries = useMemo(() => {
    if (!currentPatient?.glucometrias) return [];
    return currentPatient.glucometrias
      .filter(g => isSameDay(parseISO(g.timestamp), selectedDate))
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  }, [currentPatient?.glucometrias, selectedDate]);

  // Calculate date range based on view mode
  const { startDate, endDate } = useMemo(() => {
    switch (viewMode) {
      case 'daily':
        return { startDate: selectedDate, endDate: selectedDate };
      case 'weekly':
        return { 
          startDate: startOfWeek(selectedDate, { weekStartsOn: 1 }), 
          endDate: endOfWeek(selectedDate, { weekStartsOn: 1 }) 
        };
      case 'monthly':
        return { 
          startDate: startOfMonth(selectedDate), 
          endDate: endOfMonth(selectedDate) 
        };
      case 'quarterly':
        return { 
          startDate: startOfQuarter(selectedDate), 
          endDate: endOfQuarter(selectedDate) 
        };
    }
  }, [viewMode, selectedDate]);

  // Get records for the selected period - use patient data directly for better sync
  const periodRecords = useMemo(() => {
    if (!currentPatient?.glucometrias) return [];
    
    const glucometrias = currentPatient.glucometrias;
    
    if (viewMode === 'daily') {
      return glucometrias.filter(g => isSameDay(parseISO(g.timestamp), selectedDate));
    }
    
    // For weekly/monthly/quarterly, filter by date range
    const startInterval = startOfWeek(startDate, { weekStartsOn: 1 });
    const endInterval = endOfDay(endDate);
    
    return glucometrias
      .filter(record => {
        const recordDate = parseISO(record.timestamp);
        return recordDate >= startInterval && recordDate <= endInterval;
      })
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  }, [currentPatient?.glucometrias, viewMode, selectedDate, startDate, endDate]);

  // Get records for selected date (for daily view) - legacy format
  const dayRecords = useMemo(() => {
    return getRecordsByDate(selectedDate);
  }, [selectedDate, getRecordsByDate]);

  // Get records for selected date matched to treatment slots
  const daySlotRecords = useMemo(() => {
    const slotRecords = new Map<string, Glucometry>();
    const allDayRecords = Array.from(dayRecords.values());
    
    glucoseSlots.forEach(slot => {
      // Find the most recent record that matches this slot's time window
      const matchingRecords = allDayRecords.filter(record => recordMatchesSlot(record, slot));
      if (matchingRecords.length > 0) {
        slotRecords.set(slot.id, matchingRecords[matchingRecords.length - 1]);
      }
    });
    
    return slotRecords;
  }, [dayRecords, glucoseSlots]);

  // Calculate daily stats
  const stats = useMemo(() => {
    const values = Array.from(dayRecords.values()).map(r => r.value);
    if (values.length === 0) return null;
    
    const totalSlots = useTreatmentSlots ? glucoseSlots.length : 6;
    
    return {
      count: values.length,
      totalSlots,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      inRange: values.filter(v => v >= 70 && v <= 180).length,
    };
  }, [dayRecords, useTreatmentSlots, glucoseSlots.length]);

  const isToday = isSameDay(selectedDate, new Date());

  // Handle click on treatment slot
  const handleTreatmentSlotClick = (slot: TreatmentSlot) => {
    const record = daySlotRecords.get(slot.id);
    setSelectedSlot({ treatmentSlot: slot, record });
  };

  // Handle click on legacy slot
  const handleLegacySlotClick = (type: GlucometryType, record?: Glucometry) => {
    setSelectedSlot({ legacyType: type, record });
  };

  // Get the glucometry type for saving
  const getGlucometryTypeForSlot = (): GlucometryType => {
    if (selectedSlot?.legacyType) {
      return selectedSlot.legacyType;
    }
    if (selectedSlot?.treatmentSlot) {
      // Infer type from scheduled time
      return inferGlucometryType(selectedSlot.treatmentSlot.scheduledTime);
    }
    return 'random';
  };

  const handleSaveRecord = (value: number, notes?: string) => {
    if (!selectedSlot) return;

    const glucometryType = getGlucometryTypeForSlot();

    if (selectedSlot.record) {
      updateRecord(selectedSlot.record.id, value, notes);
    } else {
      addRecord(glucometryType, value, notes);
    }
    setSelectedSlot(null);
  };

  // Handle editing a glucometry record
  const handleEditGlucometry = async (value: number, time: string) => {
    if (!editingGlucometry) return;

    try {
      const res = await fetch(`/api/glucometries/${editingGlucometry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, time }),
      });

      if (!res.ok) {
        console.error('Error updating glucometry:', await res.text());
        return;
      }

      // Refetch patient data to update the UI
      await queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (error) {
      console.error('Error updating glucometry:', error);
    } finally {
      setEditingGlucometry(null);
    }
  };

  // Handle deleting a glucometry record
  const handleDeleteGlucometry = async (glucometryId: string) => {
    try {
      const res = await fetch(`/api/glucometries/${glucometryId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Error deleting glucometry:', await res.text());
        return;
      }

      // Refetch patient data to update the UI
      await queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (error) {
      console.error('Error deleting glucometry:', error);
    }
  };

  // Handle creating a new glucometry record
  const handleCreateGlucometry = async (value: number, time: string) => {
    if (!patientId) return;

    try {
      const res = await fetch('/api/glucometries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          value,
          time,
        }),
      });

      if (!res.ok) {
        console.error('Error creating glucometry:', await res.text());
        return;
      }

      // Refetch patient data to update the UI
      await queryClient.invalidateQueries({ queryKey: ['patient', patientId] });
    } catch (error) {
      console.error('Error creating glucometry:', error);
    } finally {
      setShowCreateGlucometry(false);
    }
  };

  // Loading state - AFTER all hooks have been called
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
          <Activity className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-2">No hay paciente seleccionado</p>
          <p className="text-sm text-muted-foreground">
            Vuelve a la página de inicio para seleccionar tu perfil.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      {/* Page Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-hig-2xl md:text-hig-3xl font-bold text-foreground mb-1 leading-hig-tight">
              Glucometrías
            </h1>
            <p className="text-muted-foreground text-hig-base leading-hig-normal">
              {viewMode === 'daily' ? 'Registro y edición' : 'Seguimiento y tendencias'}
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10"
            aria-label="Compartir registros"
          >
            <Share2 className="w-[var(--icon-md)] h-[var(--icon-md)]" />
          </Button>
        </div>
      </header>

      {/* View Mode Selector */}
      <div className="mb-4 flex justify-center">
        <ViewModeSelector value={viewMode} onChange={setViewMode} />
      </div>

      {/* Date Picker (only for daily view) */}
      {viewMode === 'daily' && (
        <div className="mb-6 flex justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal h-12 px-4 w-auto",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                <span className="capitalize">
                  {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </span>
                {isToday && (
                  <span className="ml-2 text-hig-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                    Hoy
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date > new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Daily View - EDITABLE */}
      {viewMode === 'daily' && (
        <>
          {/* Daily Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-hig-xs text-muted-foreground">Registros</span>
                </div>
                <p className="text-hig-xl font-bold text-foreground">{stats.count}/{stats.totalSlots}</p>
              </article>
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-info" />
                  <span className="text-hig-xs text-muted-foreground">Promedio</span>
                </div>
                <p className="text-hig-xl font-bold text-foreground">{stats.avg} <span className="text-hig-xs font-normal text-muted-foreground">mg/dL</span></p>
              </article>
              <article className="glass-card p-4">
                <span className="text-hig-xs text-muted-foreground">Mínimo</span>
                <p className="text-hig-xl font-bold text-warning">{stats.min} <span className="text-hig-xs font-normal text-muted-foreground">mg/dL</span></p>
              </article>
              <article className="glass-card p-4">
                <span className="text-hig-xs text-muted-foreground">Máximo</span>
                <p className="text-hig-xl font-bold text-destructive">{stats.max} <span className="text-hig-xs font-normal text-muted-foreground">mg/dL</span></p>
              </article>
            </div>
          )}

          {/* Alerts Section */}
          <section className="mb-6">
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

          {/* Glucometries of the day */}
          <section className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-hig-base font-semibold text-foreground flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Registros del día
              </h2>
              {isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateGlucometry(true)}
                  className="gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              )}
            </div>
            
            {todayGlucometries.length === 0 ? (
              <div className="text-center py-8 glass-card">
                <Droplets className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {isToday 
                    ? 'Aún no hay registros hoy'
                    : 'Sin registros este día'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayGlucometries.map((glucometry) => {
                  const value = glucometry.value;
                  const isLow = value < 70;
                  const isHigh = value > 180;
                  const isNormal = !isLow && !isHigh;
                  const hour = parseISO(glucometry.timestamp).getHours();
                  const mealLabel = getMealTimeLabel(hour);
                  
                  return (
                    <div
                      key={glucometry.id}
                      className="glass-card p-3 flex items-center justify-between"
                    >
                      <button
                        onClick={() => setEditingGlucometry(glucometry)}
                        className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-hig flex items-center justify-center",
                          isNormal && "bg-success/20",
                          isLow && "bg-warning/20",
                          isHigh && "bg-destructive/20"
                        )}>
                          <Droplets className={cn(
                            "w-5 h-5",
                            isNormal && "text-success",
                            isLow && "text-warning",
                            isHigh && "text-destructive"
                          )} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(glucometry.timestamp), 'HH:mm', { locale: es })} - {mealLabel}
                          </p>
                        </div>
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-lg font-bold",
                            isNormal && "text-success",
                            isLow && "text-warning",
                            isHigh && "text-destructive"
                          )}>
                            {value}
                          </span>
                          <span className="text-xs text-muted-foreground">mg/dL</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteGlucometry(glucometry.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {/* Weekly View - READ ONLY */}
      {viewMode === 'weekly' && (
        <WeeklyView 
          records={periodRecords} 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Monthly View - READ ONLY */}
      {viewMode === 'monthly' && (
        <MonthlyView 
          records={periodRecords} 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Quarterly View - READ ONLY */}
      {viewMode === 'quarterly' && (
        <QuarterlyView 
          records={periodRecords} 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      {/* Input Dialog - only for daily view */}
      {selectedSlot && (
        <DailyLogInputDialog
          open={!!selectedSlot}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
          type="glucose"
          glucometryType={getGlucometryTypeForSlot()}
          initialValue={selectedSlot.record?.value}
          onSave={handleSaveRecord}
        />
      )}

      {/* Create Alert Dialog */}
      <CreateAlertDialog
        open={showCreateAlertDialog}
        onOpenChange={setShowCreateAlertDialog}
        alertType="glucometry"
        onSubmit={handleCreateAlert}
      />

      {/* Edit Glucometry Dialog */}
      {editingGlucometry && (
        <DailyLogInputDialog
          open={!!editingGlucometry}
          onOpenChange={(open) => !open && setEditingGlucometry(null)}
          type="glucose"
          glucometryType={editingGlucometry.type}
          initialValue={editingGlucometry.value}
          initialTime={format(parseISO(editingGlucometry.timestamp), 'HH:mm')}
          onSave={handleEditGlucometry}
        />
      )}

      {/* Create Glucometry Dialog */}
      <DailyLogInputDialog
        open={showCreateGlucometry}
        onOpenChange={setShowCreateGlucometry}
        type="glucose"
        glucometryType="random"
        onSave={handleCreateGlucometry}
      />
    </DashboardLayout>
  );
}
