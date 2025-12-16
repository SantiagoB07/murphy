import { useState } from 'react';
import { Phone, Plus, Pencil, Trash2, Bell, CalendarDays, MessageCircle } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useAICallSchedule, CreateScheduleData } from '@/hooks/useAICallSchedule';
import { AICallSchedule, AICallPurpose, AI_CALL_PURPOSE_LABELS, DAYS_OF_WEEK_LABELS, ScheduleType, NotificationChannel, NOTIFICATION_CHANNEL_OPTIONS } from '@/types/diabetes';
import { cn } from '@/lib/utils';

interface AICallScheduleManagerProps {
  patientId: string;
  userId: string;
  userRole: 'patient' | 'coadmin';
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];
const ALL_PURPOSES: AICallPurpose[] = ['glucose', 'wellness', 'insulin', 'reminder'];

export function AICallScheduleManager({ patientId, userId, userRole }: AICallScheduleManagerProps) {
  const { schedules, isLoading, createSchedule, updateSchedule, toggleActive, deleteSchedule } = useAICallSchedule(patientId);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AICallSchedule | null>(null);

  // Form state
  const [scheduleType, setScheduleType] = useState<ScheduleType>('recurring');
  const [callTime, setCallTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<AICallPurpose[]>(['glucose']);
  const [customMessage, setCustomMessage] = useState('');
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>('call');

  const segmentedButtonClass = (isActive: boolean) => cn(
    "flex-1 min-h-[44px] px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2",
    isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  );

  const resetForm = () => {
    setScheduleType('recurring');
    setCallTime('08:00');
    setSelectedDays([1, 2, 3, 4, 5]);
    setSelectedDates([]);
    setSelectedPurposes(['glucose']);
    setCustomMessage('');
    setNotificationChannel('call');
    setEditingSchedule(null);
  };

  const openNewSchedule = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditSchedule = (schedule: AICallSchedule) => {
    setEditingSchedule(schedule);
    setScheduleType(schedule.scheduleType);
    setCallTime(schedule.callTime.slice(0, 5));
    setSelectedDays(schedule.daysOfWeek || []);
    setSelectedDates(schedule.specificDates?.map(d => new Date(d)) || []);
    setSelectedPurposes(schedule.callPurposes);
    setCustomMessage(schedule.customMessage || '');
    setNotificationChannel(schedule.notificationChannel || 'call');
    setIsOpen(true);
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handlePurposeToggle = (purpose: AICallPurpose) => {
    setSelectedPurposes(prev => 
      prev.includes(purpose) ? prev.filter(p => p !== purpose) : [...prev, purpose]
    );
  };

  const handleSubmit = async () => {
    const hasValidSelection = scheduleType === 'recurring' 
      ? selectedDays.length > 0 
      : selectedDates.length > 0;
    
    if (!hasValidSelection || selectedPurposes.length === 0) return;

    const baseData = {
      callTime,
      callPurposes: selectedPurposes,
      customMessage,
      scheduleType,
      notificationChannel,
      daysOfWeek: scheduleType === 'recurring' ? selectedDays : undefined,
      specificDates: scheduleType === 'specific' ? selectedDates.map(d => format(d, 'yyyy-MM-dd')) : undefined,
    };

    if (editingSchedule) {
      await updateSchedule.mutateAsync({
        id: editingSchedule.id,
        ...baseData,
      });
    } else {
      const data: CreateScheduleData = {
        patientId,
        scheduledByUserId: userId,
        scheduledByRole: userRole,
        ...baseData,
      };
      await createSchedule.mutateAsync(data);
    }
    setIsOpen(false);
    resetForm();
  };

  const formatScheduleInfo = (schedule: AICallSchedule) => {
    if (schedule.scheduleType === 'specific' && schedule.specificDates) {
      const dates = schedule.specificDates
        .map(d => new Date(d))
        .filter(d => d >= startOfToday())
        .map(d => format(d, "d MMM", { locale: es }));
      
      if (dates.length === 0) return 'Sin fechas pendientes';
      if (dates.length <= 3) return dates.join(', ');
      return `${dates.slice(0, 2).join(', ')} +${dates.length - 2} más`;
    }
    
    const days = schedule.daysOfWeek || [];
    if (days.length === 7) return 'Todos los días';
    if (days.length === 5 && days.every(d => d <= 5)) return 'Lun-Vie';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Fin de semana';
    return days.map(d => DAYS_OF_WEEK_LABELS[d]).join(', ');
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const isFormValid = scheduleType === 'recurring' 
    ? selectedDays.length > 0 && selectedPurposes.length > 0
    : selectedDates.length > 0 && selectedPurposes.length > 0;

  return (
    <div className="glass-card p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Alertas Automáticas</h3>
          <p className="text-sm text-muted-foreground">Programa recordatorios por llamada o WhatsApp</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Cargando...</div>
      ) : schedules.length === 0 ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No hay alertas programadas
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(schedule => (
            <div 
              key={schedule.id} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-opacity ${
                schedule.isActive ? 'bg-background/50 border-border' : 'bg-muted/30 border-muted opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {schedule.notificationChannel === 'whatsapp' ? (
                  <MessageCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Phone className="w-4 h-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatScheduleInfo(schedule)} · {formatTime(schedule.callTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {schedule.callPurposes.map(p => AI_CALL_PURPOSE_LABELS[p]).join(', ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={schedule.isActive}
                  onCheckedChange={(checked) => toggleActive.mutate({ id: schedule.id, isActive: checked })}
                  aria-label="Activar/desactivar alerta"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => openEditSchedule(schedule)}
                  aria-label="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => deleteSchedule.mutate(schedule.id)}
                  aria-label="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={openNewSchedule} variant="outline" className="w-full gap-2">
        <Plus className="w-4 h-4" />
        Programar Nueva Alerta
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingSchedule ? 'Editar Alerta' : 'Programar Alerta'}</SheetTitle>
            <SheetDescription>
              Recibe recordatorios automáticos por llamada o WhatsApp
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Notification Channel - Segmented Control */}
            <div className="space-y-2">
              <Label>Canal de notificación</Label>
              <div className="flex rounded-lg bg-muted p-1 gap-1">
                {NOTIFICATION_CHANNEL_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setNotificationChannel(value)}
                    className={segmentedButtonClass(notificationChannel === value)}
                  >
                    {value === 'call' ? <Phone className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time picker */}
            <div className="space-y-2">
              <Label htmlFor="call-time">Hora</Label>
              <Input
                id="call-time"
                type="time"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Schedule Type - Segmented Control (Apple HIG) */}
            <div className="space-y-2">
              <Label>Tipo de programación</Label>
              <div className="flex rounded-lg bg-muted p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setScheduleType('recurring')}
                  className={segmentedButtonClass(scheduleType === 'recurring')}
                >
                  Semanal
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleType('specific')}
                  className={segmentedButtonClass(scheduleType === 'specific')}
                >
                  Fechas específicas
                </button>
              </div>
            </div>

            {/* Days of week OR Calendar based on scheduleType */}
            {scheduleType === 'recurring' ? (
              <div className="space-y-2">
                <Label>Días de la semana</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={cn(
                        "min-h-[44px] min-w-[44px] px-3 rounded-lg text-sm font-medium transition-colors",
                        selectedDays.includes(day)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {DAYS_OF_WEEK_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Selecciona las fechas</Label>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  disabled={(date) => date < startOfToday()}
                  className="pointer-events-auto rounded-lg border"
                  locale={es}
                />
                {selectedDates.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map(date => (
                        <Badge key={date.toISOString()} variant="secondary">
                          {format(date, "d MMM", { locale: es })}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Purposes */}
            <div className="space-y-3">
              <Label>Propósito de la llamada</Label>
              {ALL_PURPOSES.map(purpose => (
                <div key={purpose} className="flex items-center gap-3">
                  <Checkbox
                    id={`purpose-${purpose}`}
                    checked={selectedPurposes.includes(purpose)}
                    onCheckedChange={() => handlePurposeToggle(purpose)}
                  />
                  <Label htmlFor={`purpose-${purpose}`} className="font-normal cursor-pointer">
                    {AI_CALL_PURPOSE_LABELS[purpose]}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom message */}
            <div className="space-y-2">
              <Label htmlFor="custom-message">Mensaje personalizado (opcional)</Label>
              <Textarea
                id="custom-message"
                placeholder="El asistente mencionará este mensaje al inicio de la llamada..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={!isFormValid || createSchedule.isPending || updateSchedule.isPending}
              >
                {editingSchedule ? 'Guardar Cambios' : 'Programar'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
