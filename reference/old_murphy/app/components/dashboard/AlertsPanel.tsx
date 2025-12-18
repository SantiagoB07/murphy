import { 
  Bell, 
  Clock,
  Inbox
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Reminder } from '@/app/types/diabetes';

interface AlertsPanelProps {
  reminders: Reminder[];
  compact?: boolean;
}

export function AlertsPanel({ reminders, compact = false }: AlertsPanelProps) {
  const enabledReminders = reminders.filter(r => r.enabled);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'glucose':
        return 'Glucometría';
      case 'insulin':
        return 'Insulina';
      case 'medication':
        return 'Medicación';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'glucose':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' };
      case 'insulin':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' };
      case 'medication':
        return { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/50' };
      default:
        return { bg: 'bg-muted/20', text: 'text-muted-foreground', border: 'border-muted/50' };
    }
  };

  if (compact) {
    return (
      <div className="space-y-2" role="list" aria-label="Recordatorios activos">
        {enabledReminders.slice(0, 3).map(reminder => {
          const colors = getTypeColor(reminder.alert_type);
          
          return (
            <div 
              key={reminder.id}
              role="listitem"
              className={cn(
                "flex items-center gap-3 p-3 rounded-hig border",
                colors.bg, colors.border
              )}
            >
              <Clock className={cn("w-[var(--icon-sm)] h-[var(--icon-sm)] shrink-0", colors.text)} aria-hidden="true" />
              <p className="text-hig-sm text-foreground flex-1 line-clamp-1">
                {getTypeLabel(reminder.alert_type)} - {reminder.scheduled_time}
              </p>
            </div>
          );
        })}
        {enabledReminders.length > 3 && (
          <p className="text-hig-xs text-muted-foreground text-center">
            +{enabledReminders.length - 3} recordatorios más
          </p>
        )}
        {enabledReminders.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-hig bg-muted/10 border border-muted/20">
            <Bell className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-muted-foreground" aria-hidden="true" />
            <p className="text-hig-sm text-muted-foreground">Sin recordatorios activos</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <section 
      className="glass-card overflow-hidden animate-fade-up"
      aria-labelledby="reminders-panel-title"
    >
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-hig flex items-center justify-center bg-info/20">
              <Bell className="w-[var(--icon-md)] h-[var(--icon-md)] text-info" aria-hidden="true" />
            </div>
            <div>
              <h3 id="reminders-panel-title" className="font-semibold text-hig-lg text-foreground leading-hig-tight">
                Recordatorios
              </h3>
              <p className="text-hig-sm text-muted-foreground">
                {enabledReminders.length} activo{enabledReminders.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div 
        className="divide-y divide-border/50 max-h-[400px] overflow-y-auto"
        role="list"
        aria-label="Lista de recordatorios"
      >
        {enabledReminders.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-foreground font-medium text-hig-base">Sin recordatorios</p>
            <p className="text-hig-sm text-muted-foreground mt-1">
              Configura recordatorios para tus mediciones
            </p>
          </div>
        ) : (
          enabledReminders.map((reminder, index) => {
            const colors = getTypeColor(reminder.alert_type);
            
            return (
              <div 
                key={reminder.id}
                role="listitem"
                className="p-4 transition-colors duration-hig-fast hover:bg-secondary/20"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-hig flex items-center justify-center shrink-0",
                    colors.bg
                  )}>
                    <Clock className={cn("w-[var(--icon-md)] h-[var(--icon-md)]", colors.text)} aria-hidden="true" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-hig-base">
                      {getTypeLabel(reminder.alert_type)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-hig-xs text-muted-foreground">
                        {reminder.scheduled_time} • vía {reminder.channel}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
