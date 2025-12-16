import { useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { GlucoseSlotCard } from '@/components/glucose/GlucoseSlotCard';
import { DailyLogInputDialog } from '@/components/daily-log/DailyLogInputDialog';
import { DailyXPSummary } from '@/components/glucose/DailyXPSummary';
import { ViewModeSelector } from '@/components/glucose/ViewModeSelector';
import { WeeklyView } from '@/components/glucose/WeeklyView';
import { MonthlyView } from '@/components/glucose/MonthlyView';
import { QuarterlyView } from '@/components/glucose/QuarterlyView';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGlucoseLog } from '@/hooks/useGlucoseLog';
import { useXPCalculation } from '@/hooks/useXPCalculation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Glucometry, 
  GlucometryType, 
  MEAL_TIME_SLOTS, 
  UserRole,
  ViewMode 
} from '@/types/diabetes';
import { cn } from '@/lib/utils';
import { format, isSameDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Share2, TrendingUp, Activity, Loader2 } from 'lucide-react';

export default function Glucometrias() {
  const location = useLocation();
  const { userRole: authRole, profile, patientProfile, isDemoMode, demoRole } = useAuth();
  
  // Use auth role if available, fallback to location state for demo mode compatibility
  const userRole: UserRole = authRole || demoRole || (location.state?.role as UserRole) || 'patient';
  
  // Get user name from auth profile
  const userName = profile?.full_name || 'Usuario';

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedSlot, setSelectedSlot] = useState<{
    type: GlucometryType;
    record?: Glucometry;
  } | null>(null);

  // Mock wellness state (in real app, this would come from a shared context/store)
  const [hasSleepLogged] = useState(false);
  const [hasStressLogged] = useState(false);

  // Initialize hook with patient ID from auth
  const { 
    records, 
    addRecord, 
    updateRecord, 
    getRecordsByDate,
    getRecordsInRange,
    isLoading,
  } = useGlucoseLog(patientProfile?.id);

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

  // Get records for selected date (for daily view)
  const dayRecords = useMemo(() => {
    return getRecordsByDate(selectedDate);
  }, [selectedDate, getRecordsByDate]);

  // Get today's records for XP calculation
  const todayRecords = useMemo(() => {
    const today = new Date();
    if (isSameDay(selectedDate, today)) {
      return Array.from(dayRecords.values());
    }
    return Array.from(getRecordsByDate(today).values());
  }, [selectedDate, dayRecords, getRecordsByDate]);

  // Calculate XP for today
  const xpResult = useXPCalculation({
    todayGlucoseRecords: todayRecords,
    hasSleepLogged,
    hasStressLogged,
    streakDays: patientProfile?.streak || 0,
    totalAccumulatedXP: patientProfile?.xp_level || 0,
  });

  const isToday = isSameDay(selectedDate, new Date());

  const handleSlotClick = (type: GlucometryType, record?: Glucometry) => {
    setSelectedSlot({ type, record });
  };

  const handleSaveRecord = (value: number, notes?: string) => {
    if (!selectedSlot) return;

    if (selectedSlot.record) {
      updateRecord(selectedSlot.record.id, value, notes);
    } else {
      addRecord(selectedSlot.type, value, notes);
    }
    setSelectedSlot(null);
  };

  // Calculate daily stats (for daily view)
  const stats = useMemo(() => {
    const values = Array.from(dayRecords.values()).map(r => r.value);
    if (values.length === 0) return null;
    
    return {
      count: values.length,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      inRange: values.filter(v => v >= 70 && v <= 180).length,
    };
  }, [dayRecords]);

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout userRole={userRole} userName={userName}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Cargando registros...</p>
          </div>
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
          {/* XP Summary for today */}
          {isToday && (
            <DailyXPSummary xpResult={xpResult} className="mb-6" />
          )}

          {/* Daily Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <article className="glass-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-hig-xs text-muted-foreground">Registros</span>
                </div>
                <p className="text-hig-xl font-bold text-foreground">{stats.count}/6</p>
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
            
            {MEAL_TIME_SLOTS.map((slot, index) => (
              <div 
                key={slot.type}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <GlucoseSlotCard
                  type={slot.type}
                  record={dayRecords.get(slot.type)}
                  iconName={slot.icon}
                  onClick={() => handleSlotClick(slot.type, dayRecords.get(slot.type))}
                />
              </div>
            ))}

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
          glucometryType={selectedSlot.type}
          initialValue={selectedSlot.record?.value}
          onSave={handleSaveRecord}
        />
      )}
    </DashboardLayout>
  );
}
