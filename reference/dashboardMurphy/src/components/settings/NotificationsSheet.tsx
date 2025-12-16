import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, AlertTriangle, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
    id: 'hypoglycemia_alerts',
    label: 'Alertas de hipoglucemia',
    description: 'Recibe alertas cuando tu glucosa esté por debajo de 70 mg/dL',
    icon: AlertTriangle,
    category: 'alerts',
  },
  {
    id: 'hyperglycemia_alerts',
    label: 'Alertas de hiperglucemia',
    description: 'Recibe alertas cuando tu glucosa supere los 180 mg/dL',
    icon: AlertTriangle,
    category: 'alerts',
  },
  {
    id: 'glucose_alerts',
    label: 'Alertas generales de glucosa',
    description: 'Notificaciones sobre tendencias y patrones de glucosa',
    icon: Bell,
    category: 'alerts',
  },
  {
    id: 'measurement_reminders',
    label: 'Recordatorios de medición',
    description: 'Recuerda medir tu glucosa en los horarios establecidos',
    icon: Clock,
    category: 'reminders',
  },
  {
    id: 'medication_reminders',
    label: 'Recordatorios de medicación',
    description: 'Recuerda tomar tu insulina o medicamentos',
    icon: Clock,
    category: 'reminders',
  },
  {
    id: 'daily_summary',
    label: 'Resumen diario',
    description: 'Recibe un resumen de tu día cada noche',
    icon: FileText,
    category: 'summary',
  },
];

const defaultPreferences: Record<string, boolean> = {
  hypoglycemia_alerts: true,
  hyperglycemia_alerts: true,
  glucose_alerts: true,
  measurement_reminders: true,
  medication_reminders: false,
  daily_summary: true,
};

export function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
  const { toast } = useToast();
  const { user, isDemoMode } = useAuth();
  const [preferences, setPreferences] = useState<Record<string, boolean>>(defaultPreferences);

  // Load preferences from Supabase
  useEffect(() => {
    if (!user?.id || isDemoMode) return;

    const loadPreferences = async () => {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPreferences({
          hypoglycemia_alerts: data.hypoglycemia_alerts ?? true,
          hyperglycemia_alerts: data.hyperglycemia_alerts ?? true,
          glucose_alerts: data.glucose_alerts ?? true,
          measurement_reminders: data.measurement_reminders ?? true,
          medication_reminders: data.medication_reminders ?? false,
          daily_summary: data.daily_summary ?? true,
        });
      }
    };

    loadPreferences();
  }, [user?.id, isDemoMode]);

  const handleToggle = async (id: string, checked: boolean) => {
    // Optimistic update
    setPreferences(prev => ({ ...prev, [id]: checked }));

    const setting = notificationSettings.find(s => s.id === id);
    toast({
      title: checked ? 'Notificación activada' : 'Notificación desactivada',
      description: setting?.label,
    });

    // Demo mode: only local state
    if (isDemoMode || !user?.id) return;

    // Persist to Supabase
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        [id]: checked,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [id]: !checked }));
      toast({ title: 'Error', description: 'No se pudo guardar la preferencia', variant: 'destructive' });
    }
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
