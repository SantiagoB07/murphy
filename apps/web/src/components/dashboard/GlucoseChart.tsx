import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { Glucometry, GLUCOMETRY_LABELS } from '@/types/diabetes';
import { cn } from '@/lib/utils';
import { Activity } from 'lucide-react';

// Horarios típicos de medición para los 6 slots
const MEASUREMENT_TIMES = [
  { time: '07:00', label: 'AD', fullLabel: 'Antes Desayuno', period: 'breakfast' },
  { time: '09:00', label: 'DD', fullLabel: 'Después Desayuno', period: 'breakfast' },
  { time: '12:00', label: 'AA', fullLabel: 'Antes Almuerzo', period: 'lunch' },
  { time: '14:00', label: 'DA', fullLabel: 'Después Almuerzo', period: 'lunch' },
  { time: '19:00', label: 'AC', fullLabel: 'Antes Cena', period: 'dinner' },
  { time: '21:00', label: 'DC', fullLabel: 'Después Cena', period: 'dinner' },
] as const;

// Colores por período de comida (usando tokens del sistema)
const PERIOD_COLORS = {
  breakfast: 'hsl(40, 90%, 55%)',   // Amarillo dorado - desayuno/mañana
  lunch: 'hsl(150, 60%, 45%)',      // Verde - almuerzo/mediodía
  dinner: 'hsl(260, 65%, 60%)',     // Púrpura - cena/noche
} as const;

interface GlucoseChartProps {
  data: Glucometry[];
  showTargetRange?: boolean;
  className?: string;
}

export function GlucoseChart({ data, showTargetRange = true, className }: GlucoseChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(reading => ({
        ...reading,
        time: new Date(reading.timestamp).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: new Date(reading.timestamp).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short'
        }),
        inRange: reading.value >= 70 && reading.value <= 180,
      }));
  }, [data]);

  const stats = useMemo(() => {
    if (data.length === 0) return { avg: 0, min: 0, max: 0, inRange: 0 };
    const values = data.map(d => d.value);
    const inRangeCount = values.filter(v => v >= 70 && v <= 180).length;
    return {
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      min: Math.min(...values),
      max: Math.max(...values),
      inRange: Math.round((inRangeCount / values.length) * 100),
    };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isHigh = data.value > 180;
      const isLow = data.value < 70;
      
      return (
        <div className="bg-card/95 backdrop-blur-sm p-3 rounded-hig border border-border/50 elevation-2">
          <p className="text-hig-xs text-muted-foreground mb-1">{data.date} - {data.time}</p>
          <p className={cn(
            "text-hig-lg font-bold",
            isHigh ? "text-destructive" : isLow ? "text-warning" : "text-success"
          )}>
            {data.value} mg/dL
          </p>
          <p className="text-hig-xs text-muted-foreground">{GLUCOMETRY_LABELS[data.type as keyof typeof GLUCOMETRY_LABELS] || data.type}</p>
        </div>
      );
    }
    return null;
  };

  // HIG: Empty state
  if (data.length === 0) {
    return (
      <section className={cn("glass-card p-5 animate-fade-up", className)} aria-labelledby="glucose-chart-title">
        <div className="flex items-center justify-between mb-4">
          <h3 id="glucose-chart-title" className="font-semibold text-hig-lg text-foreground leading-hig-tight">Tendencia Glucémica</h3>
        </div>
        <div className="h-64 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <p className="text-foreground font-medium text-hig-base">Sin datos de glucosa</p>
          <p className="text-hig-sm text-muted-foreground mt-1 max-w-xs">
            Registra tus mediciones para ver la tendencia aquí
          </p>
        </div>
      </section>
    );
  }

  return (
    <section 
      className={cn("glass-card p-5 animate-fade-up", className)}
      aria-labelledby="glucose-chart-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 id="glucose-chart-title" className="font-semibold text-hig-lg text-foreground leading-hig-tight">Tendencia Glucémica</h3>
        <div className="flex items-center gap-4">
          {showTargetRange && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success/50" aria-hidden="true" />
              <span className="text-hig-xs text-muted-foreground">70-180 mg/dL</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-6" role="list" aria-label="Estadísticas de glucosa">
        <div className="text-center p-2 rounded-hig bg-secondary/30" role="listitem">
          <p className="text-hig-2xl font-bold text-foreground leading-hig-tight">{stats.avg}</p>
          <p className="text-hig-xs text-muted-foreground">Promedio</p>
        </div>
        <div className="text-center p-2 rounded-hig bg-secondary/30" role="listitem">
          <p className="text-hig-2xl font-bold text-warning leading-hig-tight">{stats.min}</p>
          <p className="text-hig-xs text-muted-foreground">Mínimo</p>
        </div>
        <div className="text-center p-2 rounded-hig bg-secondary/30" role="listitem">
          <p className="text-hig-2xl font-bold text-destructive leading-hig-tight">{stats.max}</p>
          <p className="text-hig-xs text-muted-foreground">Máximo</p>
        </div>
        <div className="text-center p-2 rounded-hig bg-secondary/30" role="listitem">
          <p className="text-hig-2xl font-bold text-success leading-hig-tight">{stats.inRange}%</p>
          <p className="text-hig-xs text-muted-foreground">En rango</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64" role="img" aria-label="Gráfico de tendencia de glucosa">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(273, 100%, 71%)" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="hsl(273, 100%, 71%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            {/* HIG: Subtler grid lines */}
            <CartesianGrid 
              strokeDasharray="4 4" 
              stroke="hsl(275, 40%, 15%)" 
              vertical={false}
            />
            
            {/* Marcadores verticales para los 6 momentos de medición */}
            {MEASUREMENT_TIMES.map((slot) => (
              <ReferenceLine
                key={slot.time}
                x={slot.time}
                stroke={PERIOD_COLORS[slot.period]}
                strokeDasharray="4 4"
                strokeOpacity={0.25}
                label={{
                  value: slot.label,
                  position: 'top',
                  fill: PERIOD_COLORS[slot.period],
                  fontSize: 10,
                  fontWeight: 500,
                  opacity: 0.7,
                }}
              />
            ))}

            {showTargetRange && (
              <>
                <ReferenceLine 
                  y={180} 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeDasharray="6 4" 
                  strokeOpacity={0.4}
                />
                <ReferenceLine 
                  y={70} 
                  stroke="hsl(38, 92%, 50%)" 
                  strokeDasharray="6 4" 
                  strokeOpacity={0.4}
                />
              </>
            )}
            
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'hsl(275, 15%, 70%)', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(275, 40%, 15%)' }}
              axisLine={{ stroke: 'hsl(275, 40%, 15%)' }}
            />
            
            <YAxis 
              domain={[40, 300]}
              tick={{ fill: 'hsl(275, 15%, 70%)', fontSize: 11 }}
              tickLine={{ stroke: 'hsl(275, 40%, 15%)' }}
              axisLine={{ stroke: 'hsl(275, 40%, 15%)' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke="transparent"
              fill="url(#glucoseGradient)"
            />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(273, 100%, 71%)"
              strokeWidth={2.5}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isHigh = payload.value > 180;
                const isLow = payload.value < 70;
                const color = isHigh ? 'hsl(0, 84%, 60%)' : isLow ? 'hsl(38, 92%, 50%)' : 'hsl(273, 100%, 71%)';
                
                return (
                  <circle 
                    key={`dot-${cx}-${cy}`}
                    cx={cx} 
                    cy={cy} 
                    r={4} 
                    fill={color}
                    stroke="hsl(275, 85%, 4%)"
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{
                r: 6,
                fill: 'hsl(273, 100%, 71%)',
                stroke: 'hsl(275, 85%, 4%)',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
