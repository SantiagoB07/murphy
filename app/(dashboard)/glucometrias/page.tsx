"use client";

import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { GlucoseSlotCard } from '@/app/components/glucose/GlucoseSlotCard';
import { GlucoseTreatmentSlotCard } from '@/app/components/glucose/GlucoseTreatmentSlotCard';
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
import { cn } from '@/app/lib/utils';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Share2, TrendingUp, Activity, Loader2 } from 'lucide-react';

// Helper to match a record to a treatment slot based on time window
function recordMatchesSlot(record: Glucometry, slot: TreatmentSlot): boolean {
  const recordHour = parseISO(record.timestamp).getHours();
  const slotHour = parseInt(slot.scheduledTime.split(':')[0], 10);
  
  // Allow 1 hour before and 2 hours after scheduled time
  return recordHour >= Math.max(0, slotHour - 1) && recordHour <= Math.min(23, slotHour + 2);
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

  // Fetch patient data from Supabase
  const { data: currentPatient, isLoading, isPending, status } = usePatient(patientId);
  const userName = currentPatient?.name ?? 'Cargando...';
  
  console.log('[Glucometrias] Query state:', { patientId, isLoading, isPending, status, hasPatient: !!currentPatient });
  
  // Determine if we're in a loading state
  const isPageLoading = patientId !== null && (isLoading || isPending);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  
  // State for selected slot - can be either TreatmentSlot or legacy type
  const [selectedSlot, setSelectedSlot] = useState<{
    treatmentSlot?: TreatmentSlot;
    legacyType?: GlucometryType;
    record?: Glucometry;
  } | null>(null);

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

  // Get records for the selected period
  const periodRecords = useMemo(() => {
    if (viewMode === 'daily') {
      return Array.from(getRecordsByDate(selectedDate).values());
    }
    return getRecordsInRange(startDate, endDate);
  }, [viewMode, selectedDate, startDate, endDate, getRecordsByDate, getRecordsInRange]);

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

          <section className="space-y-3">
            <h2 className="text-hig-base font-semibold text-foreground mb-4">
              Registros del día
            </h2>
            
            {/* Use Treatment Slots if configured, otherwise fallback to MEAL_TIME_SLOTS */}
            {useTreatmentSlots ? (
              // Dynamic slots from treatment_schedule
              glucoseSlots.map((slot, index) => (
                <div 
                  key={slot.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <GlucoseTreatmentSlotCard
                    slot={slot}
                    record={daySlotRecords.get(slot.id)}
                    onClick={() => handleTreatmentSlotClick(slot)}
                  />
                </div>
              ))
            ) : (
              // Fallback to fixed MEAL_TIME_SLOTS
              MEAL_TIME_SLOTS.map((slot, index) => (
                <div 
                  key={slot.type}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <GlucoseSlotCard
                    type={slot.type}
                    record={dayRecords.get(slot.type)}
                    iconName={slot.icon}
                    onClick={() => handleLegacySlotClick(slot.type, dayRecords.get(slot.type))}
                  />
                </div>
              ))
            )}

            {dayRecords.size === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-foreground font-medium">Sin registros este día</p>
                <p className="text-hig-sm text-muted-foreground mt-1">
                  {isToday 
                    ? 'Toca cualquier momento para agregar un registro'
                    : 'No hay registros para esta fecha'
                  }
                </p>
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
    </DashboardLayout>
  );
}
