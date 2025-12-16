import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Glucometry, GlucometryType, GLUCOSE_RANGES } from '@/types/diabetes';
import { 
  format, 
  isSameDay, 
  parseISO, 
  isWithinInterval, 
  startOfDay, 
  endOfDay,
  differenceInDays 
} from 'date-fns';

// Database record type
interface GlucoseRecord {
  id: string;
  patient_id: string;
  time_slot: string;
  value: number;
  recorded_at: string;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Statistics interface for period calculations
export interface PeriodStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  inRangeCount: number;
  inRangePercent: number;
  totalDays: number;
  daysWithRecords: number;
  daysWithRecordsPercent: number;
  avgTakesPerDay: number;
  stdDev: number;
}

// Calculate statistics for a set of records
export function calculatePeriodStats(
  records: Glucometry[], 
  startDate: Date, 
  endDate: Date
): PeriodStats | null {
  if (records.length === 0) return null;

  const values = records.map(r => r.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;

  // Calculate standard deviation
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  // Count values in range (70-180)
  const inRangeCount = values.filter(v => v >= GLUCOSE_RANGES.low && v <= GLUCOSE_RANGES.high).length;

  // Calculate days in period and days with records
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  // Get unique days with records
  const daysWithRecordsSet = new Set(
    records.map(r => format(parseISO(r.timestamp), 'yyyy-MM-dd'))
  );
  const daysWithRecords = daysWithRecordsSet.size;

  return {
    count: values.length,
    avg: Math.round(avg),
    min: Math.min(...values),
    max: Math.max(...values),
    inRangeCount,
    inRangePercent: Math.round((inRangeCount / values.length) * 100),
    totalDays,
    daysWithRecords,
    daysWithRecordsPercent: Math.round((daysWithRecords / totalDays) * 100),
    avgTakesPerDay: Math.round((values.length / totalDays) * 10) / 10,
    stdDev: Math.round(stdDev),
  };
}

// Map database time_slot to GlucometryType
function mapTimeSlotToType(timeSlot: string): GlucometryType {
  const mapping: Record<string, GlucometryType> = {
    'before_breakfast': 'before_breakfast',
    'after_breakfast': 'after_breakfast',
    'before_lunch': 'before_lunch',
    'after_lunch': 'after_lunch',
    'before_dinner': 'before_dinner',
    'after_dinner': 'after_dinner',
  };
  return mapping[timeSlot] || 'before_breakfast';
}

// Map GlucometryType to database time_slot
function mapTypeToTimeSlot(type: GlucometryType): string {
  return type;
}

// Convert database record to Glucometry
function dbToGlucometry(record: GlucoseRecord): Glucometry {
  return {
    id: record.id,
    value: record.value,
    type: mapTimeSlotToType(record.time_slot),
    timestamp: record.recorded_at,
    notes: record.notes || undefined,
  };
}

interface UseGlucoseLogReturn {
  records: Glucometry[];
  todayRecords: Map<GlucometryType, Glucometry>;
  addRecord: (type: GlucometryType, value: number, notes?: string) => void;
  updateRecord: (id: string, value: number, notes?: string) => void;
  getRecordsByDate: (date: Date) => Map<GlucometryType, Glucometry>;
  getRecordsInRange: (start: Date, end: Date) => Glucometry[];
  getSlotRecord: (type: GlucometryType, date?: Date) => Glucometry | undefined;
  isLoading: boolean;
}

export function useGlucoseLog(patientId?: string): UseGlucoseLogReturn {
  const queryClient = useQueryClient();

  // Fetch all records for the patient
  const { data: dbRecords = [], isLoading } = useQuery({
    queryKey: ['glucose-records', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      
      const { data, error } = await supabase
        .from('glucose_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error fetching glucose records:', error);
        return [];
      }

      return (data as GlucoseRecord[]).map(dbToGlucometry);
    },
    enabled: !!patientId,
  });

  const records = dbRecords;

  // Add record mutation
  const addMutation = useMutation({
    mutationFn: async ({ type, value, notes }: { type: GlucometryType; value: number; notes?: string }) => {
      if (!patientId) throw new Error('No patient ID');

      const now = new Date();
      const { data, error } = await supabase
        .from('glucose_records')
        .insert({
          patient_id: patientId,
          time_slot: mapTypeToTimeSlot(type),
          value,
          recorded_at: now.toISOString(),
          date: format(now, 'yyyy-MM-dd'),
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glucose-records', patientId] });
    },
  });

  // Update record mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, value, notes }: { id: string; value: number; notes?: string }) => {
      const { data, error } = await supabase
        .from('glucose_records')
        .update({
          value,
          notes: notes || null,
          recorded_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glucose-records', patientId] });
    },
  });

  // Get records for a specific date grouped by type
  const getRecordsByDate = useCallback((date: Date): Map<GlucometryType, Glucometry> => {
    const dayRecords = new Map<GlucometryType, Glucometry>();
    
    records.forEach(record => {
      const recordDate = parseISO(record.timestamp);
      if (isSameDay(recordDate, date)) {
        // Only keep the latest record for each type
        const existing = dayRecords.get(record.type);
        if (!existing || parseISO(existing.timestamp) < recordDate) {
          dayRecords.set(record.type, record);
        }
      }
    });
    
    return dayRecords;
  }, [records]);

  // Get records within a date range
  const getRecordsInRange = useCallback((start: Date, end: Date): Glucometry[] => {
    const startInterval = startOfDay(start);
    const endInterval = endOfDay(end);

    return records
      .filter(record => {
        const recordDate = parseISO(record.timestamp);
        return isWithinInterval(recordDate, { start: startInterval, end: endInterval });
      })
      .sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  }, [records]);

  // Get today's records
  const todayRecords = useMemo(() => {
    return getRecordsByDate(new Date());
  }, [getRecordsByDate]);

  // Get a specific slot record
  const getSlotRecord = useCallback((type: GlucometryType, date: Date = new Date()): Glucometry | undefined => {
    const dayRecords = getRecordsByDate(date);
    return dayRecords.get(type);
  }, [getRecordsByDate]);

  // Add a new record
  const addRecord = useCallback((type: GlucometryType, value: number, notes?: string) => {
    addMutation.mutate({ type, value, notes });
  }, [addMutation]);

  // Update an existing record
  const updateRecord = useCallback((id: string, value: number, notes?: string) => {
    updateMutation.mutate({ id, value, notes });
  }, [updateMutation]);

  return {
    records,
    todayRecords,
    addRecord,
    updateRecord,
    getRecordsByDate,
    getRecordsInRange,
    getSlotRecord,
    isLoading,
  };
}
