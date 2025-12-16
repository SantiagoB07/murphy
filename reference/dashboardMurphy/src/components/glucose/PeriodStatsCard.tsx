import { PeriodStats } from '@/hooks/useGlucoseLog';
import { Activity, TrendingUp, Calendar, Target, BarChart3 } from 'lucide-react';

interface PeriodStatsCardProps {
  stats: PeriodStats;
  periodLabel: string;
}

export function PeriodStatsCard({ stats, periodLabel }: PeriodStatsCardProps) {
  return (
    <div className="space-y-4">
      {/* Primary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-hig-xs text-muted-foreground">Mediciones</span>
          </div>
          <p className="text-hig-xl font-bold text-foreground">{stats.count}</p>
          <p className="text-hig-xs text-muted-foreground">
            {stats.avgTakesPerDay} tomas/día
          </p>
        </article>

        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-info" />
            <span className="text-hig-xs text-muted-foreground">Promedio</span>
          </div>
          <p className="text-hig-xl font-bold text-foreground">
            {stats.avg} <span className="text-hig-xs font-normal text-muted-foreground">mg/dL</span>
          </p>
          <p className="text-hig-xs text-muted-foreground">
            ±{stats.stdDev} desv.
          </p>
        </article>

        <article className="glass-card p-4">
          <span className="text-hig-xs text-muted-foreground">Mínimo</span>
          <p className="text-hig-xl font-bold text-warning">
            {stats.min} <span className="text-hig-xs font-normal text-muted-foreground">mg/dL</span>
          </p>
        </article>

        <article className="glass-card p-4">
          <span className="text-hig-xs text-muted-foreground">Máximo</span>
          <p className="text-hig-xl font-bold text-destructive">
            {stats.max} <span className="text-hig-xs font-normal text-muted-foreground">mg/dL</span>
          </p>
        </article>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-success" />
            <span className="text-hig-xs text-muted-foreground">En rango (70-180)</span>
          </div>
          <p className="text-hig-xl font-bold text-success">
            {stats.inRangePercent}%
          </p>
          <p className="text-hig-xs text-muted-foreground">
            {stats.inRangeCount} de {stats.count} mediciones
          </p>
        </article>

        <article className="glass-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-hig-xs text-muted-foreground">Días con registro</span>
          </div>
          <p className="text-hig-xl font-bold text-foreground">
            {stats.daysWithRecordsPercent}%
          </p>
          <p className="text-hig-xs text-muted-foreground">
            {stats.daysWithRecords} de {stats.totalDays} días
          </p>
        </article>

        <article className="glass-card p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-info" />
            <span className="text-hig-xs text-muted-foreground">Período</span>
          </div>
          <p className="text-hig-base font-semibold text-foreground truncate">
            {periodLabel}
          </p>
        </article>
      </div>
    </div>
  );
}
