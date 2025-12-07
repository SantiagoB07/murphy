import { useState, useCallback, useMemo } from 'react';
import { Glucometry, GlucometryType, MEAL_TIME_SLOTS, GLUCOSE_RANGES } from '@/app/types/diabetes';
import { 
  format, 
  isSameDay, 
  parseISO, 
  isWithinInterval, 
  startOfDay, 
  endOfDay,
  differenceInDays 
} from 'date-fns';

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

interface UseGlucoseLogReturn {
  records: Glucometry[];
  todayRecords: Map<GlucometryType, Glucometry>;
  addRecord: (type: GlucometryType, value: number, notes?: string) => void;
  updateRecord: (id: string, value: number, notes?: string) => void;
  getRecordsByDate: (date: Date) => Map<GlucometryType, Glucometry>;
  getRecordsInRange: (start: Date, end: Date) => Glucometry[];
  getSlotRecord: (type: GlucometryType, date?: Date) => Glucometry | undefined;
}

export function useGlucoseLog(initialRecords: Glucometry[] = []): UseGlucoseLogReturn {
  const [records, setRecords] = useState<Glucometry[]>(initialRecords);

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
    const newRecord: Glucometry = {
      id: `glucose-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value,
      type,
      timestamp: new Date().toISOString(),
      notes,
    };

    setRecords(prev => [...prev, newRecord]);
  }, []);

  // Update an existing record
  const updateRecord = useCallback((id: string, value: number, notes?: string) => {
    setRecords(prev => prev.map(record => 
      record.id === id 
        ? { ...record, value, notes, timestamp: new Date().toISOString() }
        : record
    ));
  }, []);

  return {
    records,
    todayRecords,
    addRecord,
    updateRecord,
    getRecordsByDate,
    getRecordsInRange,
    getSlotRecord,
  };
}
