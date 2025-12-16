import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';
import { DizzinessSymptom } from '@/types/diabetes';

interface SleepData {
  hours: number;
  quality: number;
}

interface StressData {
  level: number;
  notes?: string;
}

interface DizzinessData {
  severity: number;
  symptoms?: DizzinessSymptom[];
  durationMinutes?: number;
  notes?: string;
}

interface TodayDizzinessData {
  severity: number;
  count: number;
}

export function useWellnessLog(patientId?: string) {
  const queryClient = useQueryClient();
  const today = new Date();

  // Fetch today's sleep record
  const { data: todaySleep, isLoading: sleepLoading } = useQuery({
    queryKey: ['sleep', patientId, today.toDateString()],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('patient_id', patientId)
        .eq('date', today.toISOString().split('T')[0])
        .maybeSingle();
      
      if (error) throw error;
      return data ? { hours: Number(data.hours), quality: data.quality } : null;
    },
    enabled: !!patientId,
  });

  // Fetch today's stress records
  const { data: todayStress, isLoading: stressLoading } = useQuery({
    queryKey: ['stress', patientId, today.toDateString()],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('stress_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', startOfDay(today).toISOString())
        .lte('recorded_at', endOfDay(today).toISOString())
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data ? { level: data.level } : null;
    },
    enabled: !!patientId,
  });

  // Fetch today's dizziness records
  const { data: todayDizziness, isLoading: dizzinessLoading } = useQuery({
    queryKey: ['dizziness', patientId, today.toDateString()],
    queryFn: async () => {
      if (!patientId) return null;
      
      const { data, error } = await supabase
        .from('dizziness_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', startOfDay(today).toISOString())
        .lte('recorded_at', endOfDay(today).toISOString())
        .order('recorded_at', { ascending: false });
      
      if (error) throw error;
      if (!data || data.length === 0) return null;
      
      return {
        severity: data[0].severity,
        count: data.length
      } as TodayDizzinessData;
    },
    enabled: !!patientId,
  });

  // 30-day history queries
  const thirtyDaysAgo = subDays(today, 30).toISOString().split('T')[0];

  const { data: sleepHistory = [] } = useQuery({
    queryKey: ['sleep-history', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false });
      return data ?? [];
    },
    enabled: !!patientId,
  });

  const { data: stressHistory = [] } = useQuery({
    queryKey: ['stress-history', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from('stress_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', subDays(today, 30).toISOString())
        .order('recorded_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!patientId,
  });

  const { data: dizzinessHistory = [] } = useQuery({
    queryKey: ['dizziness-history', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data } = await supabase
        .from('dizziness_records')
        .select('*')
        .eq('patient_id', patientId)
        .gte('recorded_at', subDays(today, 30).toISOString())
        .order('recorded_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!patientId,
  });

  // Save sleep mutation
  const saveSleepMutation = useMutation({
    mutationFn: async (sleepData: SleepData) => {
      if (!patientId) throw new Error('No patient ID');
      
      const { data, error } = await supabase
        .from('sleep_records')
        .upsert({
          patient_id: patientId,
          hours: sleepData.hours,
          quality: sleepData.quality,
          date: today.toISOString().split('T')[0],
        }, { onConflict: 'patient_id,date' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep', patientId] });
    },
  });

  // Save stress mutation
  const saveStressMutation = useMutation({
    mutationFn: async (stressData: StressData) => {
      if (!patientId) throw new Error('No patient ID');
      
      const { data, error } = await supabase
        .from('stress_records')
        .insert({
          patient_id: patientId,
          level: stressData.level,
          notes: stressData.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stress', patientId] });
    },
  });

  // Save dizziness mutation
  const saveDizzinessMutation = useMutation({
    mutationFn: async (dizzinessData: DizzinessData) => {
      if (!patientId) throw new Error('No patient ID');
      
      const { data, error } = await supabase
        .from('dizziness_records')
        .insert({
          patient_id: patientId,
          severity: dizzinessData.severity,
          symptoms: dizzinessData.symptoms,
          duration_minutes: dizzinessData.durationMinutes,
          notes: dizzinessData.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dizziness', patientId] });
    },
  });

  return {
    todaySleep: todaySleep ?? null,
    todayStress: todayStress ?? null,
    todayDizziness: todayDizziness ?? null,
    saveSleep: saveSleepMutation.mutate,
    saveStress: saveStressMutation.mutate,
    saveDizziness: saveDizzinessMutation.mutate,
    isLoading: sleepLoading || stressLoading || dizzinessLoading,
    sleepHistory,
    stressHistory,
    dizzinessHistory,
  };
}
