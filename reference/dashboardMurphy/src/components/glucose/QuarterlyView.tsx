import { useMemo } from 'react';
import { Glucometry } from '@/types/diabetes';
import { PeriodStatsCard } from './PeriodStatsCard';
import { calculatePeriodStats } from '@/hooks/useGlucoseLog';
import { GlucoseChart } from '@/components/dashboard/GlucoseChart';
import { 
  format, 
  startOfQuarter, 
  endOfQuarter, 
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  parseISO,
  isWithinInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuarterlyViewProps {
  records: Glucometry[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function QuarterlyView({ records, selectedDate, onDateChange }: QuarterlyViewProps) {
  const quarterStart = startOfQuarter(selectedDate);
  const quarterEnd = endOfQuarter(selectedDate);

  const stats = useMemo(() => {
    return calculatePeriodStats(records, quarterStart, quarterEnd);
  }, [records, quarterStart, quarterEnd]);

  // Get quarter number (1-4)
  const quarterNumber = Math.floor(quarterStart.getMonth() / 3) + 1;

  // Monthly breakdowns
  const monthSummaries = useMemo(() => {
    const months = eachMonthOfInterval({ start: quarterStart, end: quarterEnd });
    
    return months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthRecords = records.filter(r => {
        const date = parseISO(r.timestamp);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const values = monthRecords.map(r => r.value);
      const avg = values.length > 0 
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : null;
      
      const inRange = values.filter(v => v >= 70 && v <= 180).length;
      const inRangePercent = values.length > 0 
        ? Math.round((inRange / values.length) * 100)
        : null;

      return {
        month: monthDate,
        label: format(monthDate, 'MMMM', { locale: es }),
        count: monthRecords.length,
        avg,
        inRangePercent,
      };
    });
  }, [quarterStart, quarterEnd, records]);

  // Calculate trend
  const trend = useMemo(() => {
    const monthsWithData = monthSummaries.filter(m => m.avg !== null);
    if (monthsWithData.length < 2) return 'stable';

    const firstAvg = monthsWithData[0].avg!;
    const lastAvg = monthsWithData[monthsWithData.length - 1].avg!;
    const diff = lastAvg - firstAvg;

    if (diff < -10) return 'improving';
    if (diff > 10) return 'deteriorating';
    return 'stable';
  }, [monthSummaries]);

  const handlePrevQuarter = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 3);
    onDateChange(newDate);
  };

  const handleNextQuarter = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 3);
    if (newDate <= new Date()) {
      onDateChange(newDate);
    }
  };

  const isCurrentQuarter = 
    quarterStart.getTime() === startOfQuarter(new Date()).getTime();

  const periodLabel = `Q${quarterNumber} ${format(selectedDate, 'yyyy')}`;

  const trendConfig = {
    improving: { icon: TrendingDown, color: 'text-success', label: 'Mejorando' },
    stable: { icon: Minus, color: 'text-info', label: 'Estable' },
    deteriorating: { icon: TrendingUp, color: 'text-destructive', label: 'Empeorando' },
  };

  const TrendIcon = trendConfig[trend].icon;

  return (
    <div className="space-y-6">
      {/* Quarter Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevQuarter}
          aria-label="Trimestre anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <p className="text-hig-lg font-semibold text-foreground">
            {periodLabel}
          </p>
          <p className="text-hig-xs text-muted-foreground capitalize">
            {format(quarterStart, 'MMMM', { locale: es })} - {format(quarterEnd, 'MMMM yyyy', { locale: es })}
          </p>
          {isCurrentQuarter && (
            <span className="text-hig-xs text-primary">Este trimestre</span>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextQuarter}
          disabled={isCurrentQuarter}
          aria-label="Trimestre siguiente"
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

      {/* Trend Indicator */}
      {stats && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-hig-sm font-medium text-muted-foreground">Tendencia del trimestre</h3>
              <p className={cn("text-hig-lg font-semibold", trendConfig[trend].color)}>
                {trendConfig[trend].label}
              </p>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              trend === 'improving' && "bg-success/20",
              trend === 'stable' && "bg-info/20",
              trend === 'deteriorating' && "bg-destructive/20",
            )}>
              <TrendIcon className={cn("w-6 h-6", trendConfig[trend].color)} />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Comparison */}
      <div className="glass-card p-4">
        <h3 className="text-hig-sm font-medium text-muted-foreground mb-4">Comparación mensual</h3>
        
        <div className="grid grid-cols-3 gap-3">
          {monthSummaries.map((month, i) => (
            <div 
              key={i}
              className="rounded-lg bg-muted/10 p-3 text-center"
            >
              <p className="text-hig-sm font-medium text-foreground capitalize mb-2">
                {month.label}
              </p>
              
              {month.avg !== null ? (
                <>
                  <p className="text-hig-xl font-bold text-foreground">
                    {month.avg}
                  </p>
                  <p className="text-hig-xs text-muted-foreground">mg/dL prom.</p>
                  
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <p className="text-hig-sm font-medium text-success">
                      {month.inRangePercent}% en rango
                    </p>
                    <p className="text-hig-xs text-muted-foreground">
                      {month.count} mediciones
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-hig-sm text-muted-foreground">Sin datos</p>
                </div>
              )}
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
          <p className="text-foreground font-medium">Sin registros este trimestre</p>
          <p className="text-hig-sm text-muted-foreground mt-1">
            No hay mediciones en este período
          </p>
        </div>
      )}
    </div>
  );
}
