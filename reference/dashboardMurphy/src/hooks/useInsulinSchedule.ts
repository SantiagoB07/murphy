import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InsulinSchedule } from '@/types/diabetes';
import { useAuth } from '@/contexts/AuthContext';

interface InsulinScheduleDB {
  id: string;
  patient_id: string;
  insulin_type: 'rapid' | 'basal';
  times_per_day: number;
  units_per_dose: number;
  brand: string | null;
  effective_from: string;
  effective_until: string | null;
  change_reason: string | null;
  ordered_by: string | null;
  changed_by_user_id: string | null;
  changed_by_role: 'patient' | 'coadmin' | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Map database record to frontend interface
function mapDBToSchedule(db: InsulinScheduleDB): InsulinSchedule {
  return {
    id: db.id,
    patientId: db.patient_id,
    type: db.insulin_type,
    timesPerDay: db.times_per_day,
    unitsPerDose: db.units_per_dose,
    brand: db.brand || undefined,
    effectiveFrom: db.effective_from,
    effectiveUntil: db.effective_until || undefined,
    changeReason: db.change_reason || undefined,
    orderedBy: db.ordered_by || undefined,
    changedByUserId: db.changed_by_user_id || undefined,
    changedByRole: db.changed_by_role || undefined,
    notes: db.notes || undefined,
    isActive: db.is_active,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export interface UpdateInsulinData {
  unitsPerDose: number;
  timesPerDay: number;
  brand?: string;
  effectiveFrom: Date;
  changeReason?: string;
  orderedBy?: string;
  notes?: string;
}

export function useInsulinSchedule(patientId: string | null) {
  const queryClient = useQueryClient();
  const { user, userRole } = useAuth();

  // Fetch active schedules for patient
  const activeSchedulesQuery = useQuery({
    queryKey: ['insulin-schedules', 'active', patientId],
    queryFn: async () => {
      if (!patientId) return { rapid: null, basal: null };

      const { data, error } = await supabase
        .from('insulin_schedules')
        .select('*')
        .eq('patient_id', patientId)
        .eq('is_active', true);

      if (error) throw error;

      const schedules = (data as InsulinScheduleDB[]).map(mapDBToSchedule);
      
      return {
        rapid: schedules.find(s => s.type === 'rapid') || null,
        basal: schedules.find(s => s.type === 'basal') || null,
      };
    },
    enabled: !!patientId,
  });

  // Fetch history of all schedules
  const historyQuery = useQuery({
    queryKey: ['insulin-schedules', 'history', patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const { data, error } = await supabase
        .from('insulin_schedules')
        .select('*')
        .eq('patient_id', patientId)
        .order('effective_from', { ascending: false });

      if (error) throw error;

      return (data as InsulinScheduleDB[]).map(mapDBToSchedule);
    },
    enabled: !!patientId,
  });

  // Update/create insulin schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({
      insulinType,
      data,
    }: {
      insulinType: 'rapid' | 'basal';
      data: UpdateInsulinData;
    }) => {
      if (!patientId || !user) throw new Error('No patient or user');

      const effectiveFromStr = data.effectiveFrom.toISOString().split('T')[0];

      // 1. Deactivate current active schedule (if exists)
      await supabase
        .from('insulin_schedules')
        .update({
          is_active: false,
          effective_until: effectiveFromStr,
        })
        .eq('patient_id', patientId)
        .eq('insulin_type', insulinType)
        .eq('is_active', true);

      // 2. Insert new schedule
      const { data: newSchedule, error } = await supabase
        .from('insulin_schedules')
        .insert({
          patient_id: patientId,
          insulin_type: insulinType,
          times_per_day: data.timesPerDay,
          units_per_dose: data.unitsPerDose,
          brand: data.brand || null,
          effective_from: effectiveFromStr,
          change_reason: data.changeReason || null,
          ordered_by: data.orderedBy || null,
          changed_by_user_id: user.id,
          changed_by_role: userRole === 'coadmin' ? 'coadmin' : 'patient',
          notes: data.notes || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapDBToSchedule(newSchedule as InsulinScheduleDB);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insulin-schedules', 'active', patientId] });
      queryClient.invalidateQueries({ queryKey: ['insulin-schedules', 'history', patientId] });
    },
  });

  return {
    rapidSchedule: activeSchedulesQuery.data?.rapid || null,
    basalSchedule: activeSchedulesQuery.data?.basal || null,
    history: historyQuery.data || [],
    isLoading: activeSchedulesQuery.isLoading || historyQuery.isLoading,
    isError: activeSchedulesQuery.isError || historyQuery.isError,
    updateSchedule: updateScheduleMutation.mutate,
    isUpdating: updateScheduleMutation.isPending,
  };
}

// Helper function to calculate percentage change
export function calculateChange(prevValue: number | undefined, currentValue: number): string {
  if (!prevValue) return `Inicio: ${currentValue}U`;
  
  const diff = currentValue - prevValue;
  const percent = Math.round((diff / prevValue) * 100);
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '';
  
  return `${prevValue}U → ${currentValue}U (${arrow}${Math.abs(percent)}%)`;
}
