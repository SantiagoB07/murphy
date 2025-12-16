import { useMemo } from 'react';
import { Glucometry } from '@/types/diabetes';
import { PeriodStatsCard } from './PeriodStatsCard';
import { calculatePeriodStats } from '@/hooks/useGlucoseLog';
import { GlucoseChart } from '@/components/dashboard/GlucoseChart';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getGlucoseStatus } from '@/types/diabetes';

interface WeeklyViewProps {
  records: Glucometry[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeeklyView({ records, selectedDate, onDateChange }: WeeklyViewProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const stats = useMemo(() => {
    return calculatePeriodStats(records, weekStart, weekEnd);
  }, [records, weekStart, weekEnd]);

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  // Get records count and avg per day
  const dailySummary = useMemo(() => {
    return weekDays.map(day => {
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
  }, [weekDays, records]);

  const handlePrevWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 7);
    onDateChange(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 7);
    if (newDate <= new Date()) {
      onDateChange(newDate);
    }
  };

  const isCurrentWeek = isSameDay(weekStart, startOfWeek(new Date(), { weekStartsOn: 1 }));

  const periodLabel = `${format(weekStart, "d MMM", { locale: es })} - ${format(weekEnd, "d MMM yyyy", { locale: es })}`;

  const statusColors: Record<string, string> = {
    critical_low: 'bg-destructive',
    low: 'bg-warning',
    normal: 'bg-success',
    high: 'bg-warning',
    critical_high: 'bg-destructive',
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevWeek}
          aria-label="Semana anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <p className="text-hig-base font-semibold text-foreground capitalize">
            {periodLabel}
          </p>
          {isCurrentWeek && (
            <span className="text-hig-xs text-primary">Esta semana</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          disabled={isCurrentWeek}
          aria-label="Semana siguiente"
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

      {/* Week Days Mini Calendar */}
      <div className="glass-card p-4">
        <h3 className="text-hig-sm font-medium text-muted-foreground mb-3">Resumen por día</h3>
        <div className="grid grid-cols-7 gap-2">
          {dailySummary.map((day, index) => (
            <div 
              key={index}
              className="text-center"
            >
              <p className="text-hig-xs text-muted-foreground mb-1">
                {format(day.date, 'EEE', { locale: es })}
              </p>
              <div 
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center",
                  day.count > 0 ? "bg-primary/10" : "bg-muted/20"
                )}
              >
                <span className="text-hig-sm font-bold text-foreground">
                  {format(day.date, 'd')}
                </span>
                {day.count > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span 
                      className={cn(
                        "w-2 h-2 rounded-full",
                        day.status ? statusColors[day.status] : "bg-muted"
                      )}
                    />
                    <span className="text-hig-xs text-muted-foreground">{day.count}</span>
                  </div>
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
          <p className="text-foreground font-medium">Sin registros esta semana</p>
          <p className="text-hig-sm text-muted-foreground mt-1">
            No hay mediciones en este período
          </p>
        </div>
      )}
    </div>
  );
}
