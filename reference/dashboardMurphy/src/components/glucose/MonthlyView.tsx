import { useMemo } from 'react';
import { Glucometry, getGlucoseStatus } from '@/types/diabetes';
import { PeriodStatsCard } from './PeriodStatsCard';
import { calculatePeriodStats } from '@/hooks/useGlucoseLog';
import { GlucoseChart } from '@/components/dashboard/GlucoseChart';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  parseISO,
  getWeek,
  startOfWeek,
  endOfWeek,
  isWithinInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MonthlyViewProps {
  records: Glucometry[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MonthlyView({ records, selectedDate, onDateChange }: MonthlyViewProps) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const stats = useMemo(() => {
    return calculatePeriodStats(records, monthStart, monthEnd);
  }, [records, monthStart, monthEnd]);

  const monthDays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  // Get records summary per day for calendar
  const dailySummary = useMemo(() => {
    return monthDays.map(day => {
      const dayRecords = records.filter(r => isSameDay(parseISO(r.timestamp), day));
      const avg = dayRecords.length > 0 
        ? Math.round(dayRecords.reduce((sum, r) => sum + r.value, 0) / dayRecords.length)
        : null;
      return {
        date: day,
        count: dayRecords.length,
        avg,
        status: avg ? getGlucoseStatus(avg) : null,
      };
    });
  }, [monthDays, records]);

  // Week summaries
  const weekSummaries = useMemo(() => {
    const weeks: Array<{
      weekNum: number;
      start: Date;
      end: Date;
      count: number;
      avg: number | null;
    }> = [];

    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    
    while (currentWeekStart <= monthEnd) {
      const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
      const weekRecords = records.filter(r => {
        const date = parseISO(r.timestamp);
        return isWithinInterval(date, { start: currentWeekStart, end: currentWeekEnd });
      });

      weeks.push({
        weekNum: getWeek(currentWeekStart, { weekStartsOn: 1 }),
        start: currentWeekStart,
        end: currentWeekEnd,
        count: weekRecords.length,
        avg: weekRecords.length > 0
          ? Math.round(weekRecords.reduce((sum, r) => sum + r.value, 0) / weekRecords.length)
          : null,
      });

      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return weeks;
  }, [monthStart, monthEnd, records]);

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (newDate <= new Date()) {
      onDateChange(newDate);
    }
  };

  const isCurrentMonth = 
    monthStart.getMonth() === new Date().getMonth() && 
    monthStart.getFullYear() === new Date().getFullYear();

  const periodLabel = format(selectedDate, "MMMM yyyy", { locale: es });

  const statusColors: Record<string, string> = {
    critical_low: 'bg-destructive',
    low: 'bg-warning',
    normal: 'bg-success',
    high: 'bg-warning',
    critical_high: 'bg-destructive',
  };

  // Calendar grid with week days header
  const weekDaysHeader = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  // Calculate padding for first week
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Monday = 0

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevMonth}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <p className="text-hig-lg font-semibold text-foreground capitalize">
            {periodLabel}
          </p>
          {isCurrentMonth && (
            <span className="text-hig-xs text-primary">Este mes</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          disabled={isCurrentMonth}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Trend Chart - Positioned prominently after navigation */}
      {records.length > 0 && (
        <div className="glass-card p-4">
          <GlucoseChart data={records} showTargetRange className="w-full" />
        </div>
      )}

      {/* Calendar View */}
      <div className="glass-card p-4">
        <h3 className="text-hig-sm font-medium text-muted-foreground mb-3">Calendario de registros</h3>
        
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDaysHeader.map((day, i) => (
            <div key={i} className="text-center text-hig-xs text-muted-foreground font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for padding */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          
          {dailySummary.map((day, index) => (
            <div 
              key={index}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-center p-1",
                day.count > 0 ? "bg-primary/10" : "bg-muted/10",
                isSameDay(day.date, new Date()) && "ring-2 ring-primary"
              )}
            >
              <span className="text-hig-xs font-medium text-foreground">
                {format(day.date, 'd')}
              </span>
              {day.count > 0 && (
                <span 
                  className={cn(
                    "w-2 h-2 rounded-full mt-0.5",
                    day.status ? statusColors[day.status] : "bg-muted"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span className="text-hig-xs text-muted-foreground">En rango</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-hig-xs text-muted-foreground">Bajo/Alto</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            <span className="text-hig-xs text-muted-foreground">Crítico</span>
          </div>
        </div>
      </div>

      {/* Week Summaries */}
      <div className="glass-card p-4">
        <h3 className="text-hig-sm font-medium text-muted-foreground mb-3">Resumen por semana</h3>
        <div className="space-y-2">
          {weekSummaries.map((week, i) => (
            <div 
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/10"
            >
              <span className="text-hig-sm text-foreground">
                Sem. {week.weekNum}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-hig-xs text-muted-foreground">
                  {week.count} tomas
                </span>
                {week.avg !== null && (
                  <span className="text-hig-sm font-medium text-foreground">
                    {week.avg} mg/dL
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats ? (
        <PeriodStatsCard stats={stats} periodLabel={periodLabel} />
      ) : (
        <div className="glass-card p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">Sin registros este mes</p>
          <p className="text-hig-sm text-muted-foreground mt-1">
            No hay mediciones en este período
          </p>
        </div>
      )}
    </div>
  );
}
