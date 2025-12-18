import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Switch } from '@/app/components/ui/switch';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { useToast } from '@/app/hooks/use-toast';
import { Bell, AlertTriangle, Clock, FileText } from 'lucide-react';

interface NotificationsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: 'alerts' | 'reminders' | 'summary';
}

const notificationSettings: NotificationSetting[] = [
  {
    id: 'hypoglycemiaAlerts',
    label: 'Alertas de hipoglucemia',
    description: 'Recibe alertas cuando tu glucosa esté por debajo de 70 mg/dL',
    icon: AlertTriangle,
    category: 'alerts',
  },
  {
    id: 'hyperglycemiaAlerts',
    label: 'Alertas de hiperglucemia',
    description: 'Recibe alertas cuando tu glucosa supere los 180 mg/dL',
    icon: AlertTriangle,
    category: 'alerts',
  },
  {
    id: 'glucoseAlerts',
    label: 'Alertas generales de glucosa',
    description: 'Notificaciones sobre tendencias y patrones de glucosa',
    icon: Bell,
    category: 'alerts',
  },
  {
    id: 'measurementReminders',
    label: 'Recordatorios de medición',
    description: 'Recuerda medir tu glucosa en los horarios establecidos',
    icon: Clock,
    category: 'reminders',
  },
  {
    id: 'medicationReminders',
    label: 'Recordatorios de medicación',
    description: 'Recuerda tomar tu insulina o medicamentos',
    icon: Clock,
    category: 'reminders',
  },
  {
    id: 'dailySummary',
    label: 'Resumen diario',
    description: 'Recibe un resumen de tu día cada noche',
    icon: FileText,
    category: 'summary',
  },
];

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    hypoglycemiaAlerts: true,
    hyperglycemiaAlerts: true,
    glucoseAlerts: true,
    measurementReminders: true,
    medicationReminders: false,
    dailySummary: true,
  });

  const handleToggle = (id: string, checked: boolean) => {
    setPreferences(prev => ({ ...prev, [id]: checked }));
    
    const setting = notificationSettings.find(s => s.id === id);
    toast({
      title: checked ? 'Notificación activada' : 'Notificación desactivada',
      description: setting?.label,
    });
  };

  const alertSettings = notificationSettings.filter(s => s.category === 'alerts');
  const reminderSettings = notificationSettings.filter(s => s.category === 'reminders');
  const summarySettings = notificationSettings.filter(s => s.category === 'summary');

  const renderSettingGroup = (settings: NotificationSetting[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {settings.map((setting) => (
        <div
          key={setting.id}
          className="flex items-start gap-4 p-3 rounded-lg bg-secondary/30"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <setting.icon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <Label
              htmlFor={setting.id}
              className="text-sm font-medium cursor-pointer"
            >
              {setting.label}
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {setting.description}
            </p>
          </div>
          <Switch
            id={setting.id}
            checked={preferences[setting.id]}
            onCheckedChange={(checked) => handleToggle(setting.id, checked)}
            aria-label={setting.label}
          />
        </div>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notificaciones</SheetTitle>
          <SheetDescription>
            Configura qué alertas y recordatorios deseas recibir
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {renderSettingGroup(alertSettings, 'Alertas de glucosa')}
          <Separator />
          {renderSettingGroup(reminderSettings, 'Recordatorios')}
          <Separator />
          {renderSettingGroup(summarySettings, 'Resúmenes')}
        </div>
      </SheetContent>
    </Sheet>
  );
}
