import { Glucometry, GlucometryType, GLUCOMETRY_LABELS, getGlucoseStatus } from '@/types/diabetes';
import { cn } from '@/lib/utils';
import { Sunrise, Coffee, Sun, Utensils, Sunset, Moon, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface GlucoseSlotCardProps {
  type: GlucometryType;
  record?: Glucometry;
  onClick: () => void;
  iconName: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sunrise,
  Coffee,
  Sun,
  Utensils,
  Sunset,
  Moon,
};

const statusColors = {
  critical_low: 'text-destructive',
  low: 'text-warning',
  normal: 'text-success',
  high: 'text-warning',
  critical_high: 'text-destructive',
};

const statusBgColors = {
  critical_low: 'bg-destructive/20',
  low: 'bg-warning/20',
  normal: 'bg-success/20',
  high: 'bg-warning/20',
  critical_high: 'bg-destructive/20',
};

export function GlucoseSlotCard({ type, record, onClick, iconName }: GlucoseSlotCardProps) {
  const Icon = iconMap[iconName] || Sun;
  const label = GLUCOMETRY_LABELS[type];
  const hasRecord = !!record;
  const status = record ? getGlucoseStatus(record.value) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-hig border transition-all",
        "min-h-[var(--touch-target-comfortable)] focus-ring press-feedback",
        hasRecord 
          ? "bg-secondary/30 border-border/50 hover:bg-secondary/50"
          : "bg-muted/20 border-border/30 hover:bg-muted/40"
      )}
      aria-label={hasRecord 
        ? `${label}: ${record.value} mg/dL, ${status === 'normal' ? 'normal' : status === 'high' || status === 'critical_high' ? 'alto' : 'bajo'}` 
        : `Registrar ${label}`
      }
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-hig flex items-center justify-center flex-shrink-0",
        hasRecord && status ? statusBgColors[status] : "bg-muted/30"
      )}>
        <Icon 
          className={cn(
            "w-[var(--icon-md)] h-[var(--icon-md)]",
            hasRecord && status ? statusColors[status] : "text-muted-foreground"
          )} 
          aria-hidden="true" 
        />
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <p className={cn(
          "text-hig-sm font-medium",
          hasRecord ? "text-foreground" : "text-muted-foreground"
        )}>
          {label}
        </p>
        {hasRecord ? (
          <p className={cn("text-hig-xs", status ? statusColors[status] : "text-muted-foreground")}>
            {format(parseISO(record.timestamp), 'HH:mm', { locale: es })}
          </p>
        ) : (
          <p className="text-hig-xs text-muted-foreground/70">
            <span className="action-text-adaptive" /> para registrar
          </p>
        )}
      </div>

      {/* Value or Check */}
      {hasRecord ? (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-hig-lg font-bold",
            status ? statusColors[status] : "text-foreground"
          )}>
            {record.value}
          </span>
          <span className="text-hig-xs text-muted-foreground">mg/dL</span>
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            status ? statusBgColors[status] : "bg-success/20"
          )}>
            <Check className={cn(
              "w-3 h-3",
              status ? statusColors[status] : "text-success"
            )} aria-hidden="true" />
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground/50">
          <span className="text-hig-sm">—</span>
        </div>
      )}
    </button>
  );
}
