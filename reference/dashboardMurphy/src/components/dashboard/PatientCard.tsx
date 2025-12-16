import { useMemo } from 'react';
import { 
  Activity, 
  Moon, 
  Syringe, 
  Brain, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Patient } from '@/types/diabetes';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  compact?: boolean;
}

export function PatientCard({ patient, onClick, compact = false }: PatientCardProps) {
  const latestGlucose = patient.glucometrias[0];
  const latestSleep = patient.sueno[0];
  const latestStress = patient.estres[0];
  const criticalAlerts = patient.alertas.filter(a => a.severity === 'critical' && !a.resolved);

  const glucoseStatus = useMemo(() => {
    if (!latestGlucose) return null;
    const value = latestGlucose.value;
    if (value < 70) return { status: 'critical', label: 'Bajo', color: 'text-destructive' };
    if (value < 80) return { status: 'warning', label: 'Límite bajo', color: 'text-warning' };
    if (value <= 130) return { status: 'success', label: 'Normal', color: 'text-success' };
    if (value <= 180) return { status: 'warning', label: 'Elevado', color: 'text-warning' };
    return { status: 'critical', label: 'Alto', color: 'text-destructive' };
  }, [latestGlucose]);

  const trendIcon = useMemo(() => {
    if (!patient.glucometrias.length || patient.glucometrias.length < 2) {
      return <Minus className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-muted-foreground" aria-hidden="true" />;
    }
    const diff = patient.glucometrias[0].value - patient.glucometrias[1].value;
    if (diff > 20) return <TrendingUp className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-destructive" aria-label="Tendencia al alza" />;
    if (diff < -20) return <TrendingDown className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-success" aria-label="Tendencia a la baja" />;
    return <Minus className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-muted-foreground" aria-hidden="true" />;
  }, [patient.glucometrias]);

  if (compact) {
    return (
      <article 
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        aria-label={`Ficha de ${patient.name}`}
        className={cn(
          "glass-card p-4 cursor-pointer",
          "transition-all duration-hig-fast ease-hig-out",
          "hover:shadow-elevation-2 focus-ring press-feedback",
          criticalAlerts.length > 0 && "border-destructive/50 pulse-alert"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-hig bg-gradient-purple flex items-center justify-center shrink-0">
            <span className="text-hig-sm font-bold text-foreground">
              {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground truncate text-hig-base">{patient.name}</p>
            <p className="text-hig-xs text-muted-foreground">{patient.diabetesType}</p>
          </div>
          {latestGlucose && (
            <div className="text-right">
              <p className={cn("text-hig-lg font-bold", glucoseStatus?.color)}>
                {latestGlucose.value}
              </p>
              <p className="text-hig-xs text-muted-foreground">mg/dL</p>
            </div>
          )}
        </div>
      </article>
    );
  }

  return (
    <article 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      aria-label={`Ficha completa de ${patient.name}`}
      className={cn(
        "glass-card overflow-hidden cursor-pointer animate-fade-up",
        "transition-shadow duration-hig-fast ease-hig-out",
        "hover:shadow-elevation-2 focus-ring",
        criticalAlerts.length > 0 && "border-destructive/50"
      )}
    >
      {/* Critical Alert Banner */}
      {criticalAlerts.length > 0 && (
        <div 
          className="bg-destructive/20 border-b border-destructive/30 px-4 py-2 flex items-center gap-2"
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-destructive" aria-hidden="true" />
          <span className="text-hig-sm font-medium text-destructive">
            {criticalAlerts.length} alerta{criticalAlerts.length > 1 ? 's' : ''} crítica{criticalAlerts.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-hig-lg bg-gradient-purple flex items-center justify-center elevation-1">
              <span className="text-hig-xl font-bold text-foreground">
                {patient.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-hig-lg text-foreground leading-hig-tight">{patient.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-hig-xs font-medium bg-purple-500/20 text-purple-400">
                  {patient.diabetesType}
                </span>
                <span className="text-hig-xs text-muted-foreground">
                  {patient.age} años • Estrato {patient.estrato}
                </span>
              </div>
            </div>
          </div>
          
          {/* Telegram Status */}
          <div 
            className={cn(
              "p-2 rounded-hig",
              patient.telegramConnected ? "bg-success/20" : "bg-muted"
            )}
            aria-label={patient.telegramConnected ? "Telegram conectado" : "Telegram no conectado"}
          >
            <MessageCircle className={cn(
              "w-[var(--icon-sm)] h-[var(--icon-sm)]",
              patient.telegramConnected ? "text-success" : "text-muted-foreground"
            )} aria-hidden="true" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4" role="list" aria-label="Estadísticas del paciente">
          {/* Glucose */}
          <div className="bg-secondary/30 p-3 rounded-hig" role="listitem">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-purple-400" aria-hidden="true" />
              <span className="text-hig-xs text-muted-foreground">Glucosa</span>
            </div>
            {latestGlucose ? (
              <div className="flex items-end gap-1">
                <span className={cn("text-hig-2xl font-bold leading-hig-tight", glucoseStatus?.color)}>
                  {latestGlucose.value}
                </span>
                <span className="text-hig-xs text-muted-foreground mb-1">mg/dL</span>
                {trendIcon}
              </div>
            ) : (
              <span className="text-muted-foreground text-hig-sm">Sin datos</span>
            )}
          </div>

          {/* Sleep */}
          <div className="bg-secondary/30 p-3 rounded-hig" role="listitem">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-info" aria-hidden="true" />
              <span className="text-hig-xs text-muted-foreground">Sueño</span>
            </div>
            {latestSleep ? (
              <div className="flex items-end gap-1">
                <span className="text-hig-2xl font-bold text-foreground leading-hig-tight">{latestSleep.hours}</span>
                <span className="text-hig-xs text-muted-foreground mb-1">hrs</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-hig-sm">Sin datos</span>
            )}
          </div>

          {/* Insulin */}
          <div className="bg-secondary/30 p-3 rounded-hig" role="listitem">
            <div className="flex items-center gap-2 mb-2">
              <Syringe className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-warning" aria-hidden="true" />
              <span className="text-hig-xs text-muted-foreground">Insulina</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-hig-2xl font-bold text-foreground leading-hig-tight">
                {patient.insulina.reduce((sum, i) => sum + i.units, 0)}
              </span>
              <span className="text-hig-xs text-muted-foreground mb-1">U/día</span>
            </div>
          </div>

          {/* Stress */}
          <div className="bg-secondary/30 p-3 rounded-hig" role="listitem">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-accent" aria-hidden="true" />
              <span className="text-hig-xs text-muted-foreground">Estrés</span>
            </div>
            {latestStress ? (
              <div className="flex items-end gap-1">
                <span className={cn(
                  "text-hig-2xl font-bold leading-hig-tight",
                  latestStress.level >= 7 ? "text-destructive" : 
                  latestStress.level >= 5 ? "text-warning" : "text-success"
                )}>
                  {latestStress.level}
                </span>
                <span className="text-hig-xs text-muted-foreground mb-1">/10</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-hig-sm">Sin datos</span>
            )}
          </div>
        </div>

        {/* XP and Streak */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-hig bg-gradient-purple flex items-center justify-center">
                <Zap className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-foreground" aria-hidden="true" />
              </div>
              <div>
                <p className="text-hig-xs text-muted-foreground">Nivel XP</p>
                <p className="font-semibold text-foreground text-hig-sm">{patient.xpLevel}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-hig bg-warning/20 flex items-center justify-center">
                <span className="text-warning" aria-hidden="true">🔥</span>
              </div>
              <div>
                <p className="text-hig-xs text-muted-foreground">Racha</p>
                <p className="font-semibold text-foreground text-hig-sm">{patient.streak} días</p>
              </div>
            </div>
          </div>
          
          <button 
            className="btn-neon text-hig-sm py-2 px-4 focus-ring"
            aria-label={`Ver detalles de ${patient.name}`}
          >
            Ver detalles
          </button>
        </div>
      </div>
    </article>
  );
}
