import { useMemo } from 'react';
import { Glucometry } from '@/app/types/diabetes';
import { PeriodStatsCard } from './PeriodStatsCard';
import { calculatePeriodStats } from '@/app/hooks/useGlucoseLog';
import { GlucoseChart } from '@/app/components/dashboard/GlucoseChart';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  parseISO,
  getWeek,
  startOfWeek,
  endOfWeek,
  isWithinInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

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

      {/* Trend Chart */}
      {records.length > 0 && (
        <div className="glass-card p-4">
          <GlucoseChart data={records} showTargetRange className="w-full" />
        </div>
      )}
    </div>
  );
}
