import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AICallSchedule, AICallPurpose, NotificationChannel } from '@/types/diabetes';
import { useToast } from '@/hooks/use-toast';

interface AICallScheduleDB {
  id: string;
  patient_id: string;
  scheduled_by_user_id: string;
  scheduled_by_role: string;
  schedule_type: string;
  call_time: string;
  days_of_week: number[] | null;
  specific_dates: string[] | null;
  call_purposes: string[];
  custom_message: string | null;
  notification_channel: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const mapDBToSchedule = (db: AICallScheduleDB): AICallSchedule => ({
  id: db.id,
  patientId: db.patient_id,
  scheduledByUserId: db.scheduled_by_user_id,
  scheduledByRole: db.scheduled_by_role as 'patient' | 'coadmin',
  scheduleType: (db.schedule_type || 'recurring') as 'recurring' | 'specific',
  callTime: db.call_time,
  daysOfWeek: db.days_of_week || [],
  specificDates: db.specific_dates || undefined,
  callPurposes: db.call_purposes as AICallPurpose[],
  customMessage: db.custom_message || undefined,
  notificationChannel: (db.notification_channel || 'call') as NotificationChannel,
  isActive: db.is_active,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export interface CreateScheduleData {
  patientId: string;
  scheduledByUserId: string;
  scheduledByRole: 'patient' | 'coadmin';
  scheduleType: 'recurring' | 'specific';
  callTime: string;
  daysOfWeek?: number[];
  specificDates?: string[];
  callPurposes: AICallPurpose[];
  customMessage?: string;
  notificationChannel?: NotificationChannel;
}

export function useAICallSchedule(patientId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: ['ai-call-schedules', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('ai_call_schedules')
        .select('*')
        .eq('patient_id', patientId)
        .order('call_time', { ascending: true });

      if (error) throw error;
      return (data as AICallScheduleDB[]).map(mapDBToSchedule);
    },
    enabled: !!patientId,
  });

  const createSchedule = useMutation({
    mutationFn: async (data: CreateScheduleData) => {
      const { error } = await supabase.from('ai_call_schedules').insert({
        patient_id: data.patientId,
        scheduled_by_user_id: data.scheduledByUserId,
        scheduled_by_role: data.scheduledByRole,
        schedule_type: data.scheduleType,
        call_time: data.callTime,
        days_of_week: data.scheduleType === 'recurring' ? data.daysOfWeek : null,
        specific_dates: data.scheduleType === 'specific' ? data.specificDates : null,
        call_purposes: data.callPurposes,
        custom_message: data.customMessage || null,
        notification_channel: data.notificationChannel || 'call',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-call-schedules', patientId] });
      toast({ title: 'Alerta programada', description: 'Se ha programado la alerta automática.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo programar la alerta.', variant: 'destructive' });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateScheduleData> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (data.callTime) updateData.call_time = data.callTime;
      if (data.scheduleType) {
        updateData.schedule_type = data.scheduleType;
        updateData.days_of_week = data.scheduleType === 'recurring' ? data.daysOfWeek : null;
        updateData.specific_dates = data.scheduleType === 'specific' ? data.specificDates : null;
      }
      if (data.callPurposes) updateData.call_purposes = data.callPurposes;
      if (data.customMessage !== undefined) updateData.custom_message = data.customMessage || null;
      if (data.notificationChannel) updateData.notification_channel = data.notificationChannel;

      const { error } = await supabase
        .from('ai_call_schedules')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-call-schedules', patientId] });
      toast({ title: 'Alerta actualizada', description: 'Se ha actualizado la programación.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo actualizar la alerta.', variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('ai_call_schedules')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-call-schedules', patientId] });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_call_schedules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-call-schedules', patientId] });
      toast({ title: 'Alerta eliminada', description: 'Se ha eliminado la programación.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'No se pudo eliminar la llamada.', variant: 'destructive' });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    createSchedule,
    updateSchedule,
    toggleActive,
    deleteSchedule,
  };
}