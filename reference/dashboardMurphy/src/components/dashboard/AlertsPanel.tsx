import { 
  AlertTriangle, 
  Bell, 
  Check, 
  X, 
  Clock,
  TrendingUp,
  TrendingDown,
  Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertSeverity } from '@/types/diabetes';

interface AlertsPanelProps {
  alerts: Alert[];
  onResolve?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  compact?: boolean;
}

export function AlertsPanel({ alerts, onResolve, onDismiss, compact = false }: AlertsPanelProps) {
  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  const severityConfig: Record<AlertSeverity, { 
    icon: typeof AlertTriangle; 
    color: string; 
    bgColor: string;
    borderColor: string;
  }> = {
    critical: { 
      icon: AlertTriangle, 
      color: 'text-destructive', 
      bgColor: 'bg-destructive/20',
      borderColor: 'border-destructive/50'
    },
    warning: { 
      icon: TrendingUp, 
      color: 'text-warning', 
      bgColor: 'bg-warning/20',
      borderColor: 'border-warning/50'
    },
    info: { 
      icon: Bell, 
      color: 'text-info', 
      bgColor: 'bg-info/20',
      borderColor: 'border-info/50'
    },
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    if (diffHours > 0) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return 'hace unos minutos';
  };

  if (compact) {
    return (
      <div className="space-y-2" role="list" aria-label="Alertas recientes">
        {unresolvedAlerts.slice(0, 3).map(alert => {
          const config = severityConfig[alert.severity];
          const Icon = config.icon;
          
          return (
            <div 
              key={alert.id}
              role="listitem"
              className={cn(
                "flex items-center gap-3 p-3 rounded-hig border",
                config.bgColor, config.borderColor,
                alert.severity === 'critical' && "pulse-alert"
              )}
            >
              <Icon className={cn("w-[var(--icon-sm)] h-[var(--icon-sm)] shrink-0", config.color)} aria-hidden="true" />
              <p className="text-hig-sm text-foreground flex-1 line-clamp-1">{alert.message}</p>
            </div>
          );
        })}
        {unresolvedAlerts.length > 3 && (
          <p className="text-hig-xs text-muted-foreground text-center">
            +{unresolvedAlerts.length - 3} alertas más
          </p>
        )}
        {unresolvedAlerts.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-hig bg-success/10 border border-success/20">
            <Check className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-success" aria-hidden="true" />
            <p className="text-hig-sm text-success">Sin alertas pendientes</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section 
      className="glass-card overflow-hidden animate-fade-up"
      aria-labelledby="alerts-panel-title"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-hig flex items-center justify-center",
              unresolvedAlerts.some(a => a.severity === 'critical') 
                ? "bg-destructive/20" 
                : "bg-warning/20"
            )}>
              <Bell className={cn(
                "w-[var(--icon-md)] h-[var(--icon-md)]",
                unresolvedAlerts.some(a => a.severity === 'critical') 
                  ? "text-destructive" 
                  : "text-warning"
              )} aria-hidden="true" />
            </div>
            <div>
              <h3 id="alerts-panel-title" className="font-semibold text-hig-lg text-foreground leading-hig-tight">Alertas</h3>
              <p className="text-hig-sm text-muted-foreground">
                {unresolvedAlerts.length} pendiente{unresolvedAlerts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div 
        className="divide-y divide-border/50 max-h-[400px] overflow-y-auto"
        role="list"
        aria-label="Lista de alertas"
      >
        {unresolvedAlerts.length === 0 ? (
          /* HIG: Empty state with illustration */
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-success" aria-hidden="true" />
            </div>
            <p className="text-foreground font-medium text-hig-base">¡Todo en orden!</p>
            <p className="text-hig-sm text-muted-foreground mt-1">No hay alertas pendientes</p>
          </div>
        ) : (
          unresolvedAlerts.map((alert, index) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;
            
            return (
              <div 
                key={alert.id}
                role="listitem"
                aria-label={`${alert.severity === 'critical' ? 'Alerta crítica' : 'Alerta'}: ${alert.message}`}
                className={cn(
                  "p-4 transition-colors duration-hig-fast hover:bg-secondary/20",
                  alert.severity === 'critical' && "bg-destructive/5"
                )}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-hig flex items-center justify-center shrink-0",
                    config.bgColor
                  )}>
                    <Icon className={cn("w-[var(--icon-md)] h-[var(--icon-md)]", config.color)} aria-hidden="true" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-hig-base">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                      <span className="text-hig-xs text-muted-foreground">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons - HIG: 44px touch targets */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => onResolve?.(alert.id)}
                      aria-label={`Marcar alerta "${alert.message}" como resuelta`}
                      className={cn(
                        "touch-target flex items-center justify-center rounded-hig",
                        "hover:bg-success/20 text-muted-foreground hover:text-success",
                        "transition-colors duration-hig-fast focus-ring press-feedback"
                      )}
                    >
                      <Check className="w-[var(--icon-md)] h-[var(--icon-md)]" aria-hidden="true" />
                    </button>
                    <button 
                      onClick={() => onDismiss?.(alert.id)}
                      aria-label={`Descartar alerta "${alert.message}"`}
                      className={cn(
                        "touch-target flex items-center justify-center rounded-hig",
                        "hover:bg-destructive/20 text-muted-foreground hover:text-destructive",
                        "transition-colors duration-hig-fast focus-ring press-feedback"
                      )}
                    >
                      <X className="w-[var(--icon-md)] h-[var(--icon-md)]" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolved Section */}
      {resolvedAlerts.length > 0 && (
        <div className="p-4 border-t border-border/50 bg-secondary/10">
          <p className="text-hig-xs text-muted-foreground mb-2">
            Resueltas recientemente ({resolvedAlerts.length})
          </p>
          <div className="space-y-2">
            {resolvedAlerts.slice(0, 2).map(alert => (
              <div key={alert.id} className="flex items-center gap-2 text-hig-sm text-muted-foreground">
                <Check className="w-3 h-3 text-success shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
