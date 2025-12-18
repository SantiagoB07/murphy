import { InsulinDose, TreatmentSlot, getTimeSlotIcon } from '@/app/types/diabetes';
import { cn } from '@/app/lib/utils';
import { Sunrise, Coffee, Sun, Utensils, Sunset, Moon, Check, Syringe } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface InsulinSlotCardProps {
  slot: TreatmentSlot;
  record?: InsulinDose;
  onClick: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sunrise,
  Coffee,
  Sun,
  Utensils,
  Sunset,
  Moon,
  Syringe,
};

// Check if applied dose matches expected
function getDoseStatus(applied: number, expected: number | null): 'match' | 'over' | 'under' | null {
  if (expected === null) return null;
  if (applied === expected) return 'match';
  return applied > expected ? 'over' : 'under';
}

const statusColors = {
  match: 'text-success',
  over: 'text-warning',
  under: 'text-warning',
};

const statusBgColors = {
  match: 'bg-success/20',
  over: 'bg-warning/20',
  under: 'bg-warning/20',
};

export function InsulinSlotCard({ slot, record, onClick }: InsulinSlotCardProps) {
  const iconName = getTimeSlotIcon(slot.scheduledTime);
  const Icon = iconMap[iconName] || Syringe;
  const label = slot.label || `Insulina ${slot.insulinType === 'basal' ? 'Basal' : 'Rápida'}`;
  const hasRecord = !!record;
  const status = record && slot.expectedDose ? getDoseStatus(record.dose, slot.expectedDose) : null;

  // Format scheduled time for display (HH:MM)
  const scheduledTimeFormatted = slot.scheduledTime.substring(0, 5);

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
        ? `${label}: ${record.dose} unidades aplicadas` 
        : `Registrar ${label}`
      }
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-hig flex items-center justify-center flex-shrink-0",
        hasRecord && status ? statusBgColors[status] : hasRecord ? "bg-success/20" : "bg-muted/30"
      )}>
        <Icon 
          className={cn(
            "w-[var(--icon-md)] h-[var(--icon-md)]",
            hasRecord && status ? statusColors[status] : hasRecord ? "text-success" : "text-muted-foreground"
          )} 
          aria-hidden="true" 
        />
      </div>

      {/* Content */}
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-hig-sm font-medium",
            hasRecord ? "text-foreground" : "text-muted-foreground"
          )}>
            {label}
          </p>
          {slot.insulinType && (
            <span className={cn(
              "text-hig-xs px-1.5 py-0.5 rounded",
              slot.insulinType === 'basal' 
                ? "bg-info/20 text-info" 
                : "bg-warning/20 text-warning"
            )}>
              {slot.insulinType === 'basal' ? 'Basal' : 'Rápida'}
            </span>
          )}
        </div>
        {hasRecord ? (
          <p className={cn("text-hig-xs", status ? statusColors[status] : "text-muted-foreground")}>
            {format(parseISO(record.timestamp), 'HH:mm', { locale: es })}
          </p>
        ) : (
          <p className="text-hig-xs text-muted-foreground/70">
            Programada: {scheduledTimeFormatted} · Toca para registrar
          </p>
        )}
      </div>

      {/* Value or Expected Dose */}
      {hasRecord ? (
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-hig-lg font-bold",
            status ? statusColors[status] : "text-success"
          )}>
            {record.dose}
          </span>
          <span className="text-hig-xs text-muted-foreground">U</span>
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
        <div className="text-right">
          {slot.expectedDose && (
            <p className="text-hig-sm text-muted-foreground">
              {slot.expectedDose} <span className="text-hig-xs">U</span>
            </p>
          )}
          <span className="text-hig-xs text-muted-foreground/50">pendiente</span>
        </div>
      )}
    </button>
  );
}
