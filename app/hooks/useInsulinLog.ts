import { useState, useCallback, useMemo } from 'react';
import { InsulinDose, InsulinType, TreatmentSlot } from '@/app/types/diabetes';
import { 
  format, 
  isSameDay, 
  parseISO, 
  isWithinInterval, 
  startOfDay, 
  endOfDay,
  parse
} from 'date-fns';

interface UseInsulinLogReturn {
  records: InsulinDose[];
  todayRecords: InsulinDose[];
  addRecord: (dose: number, insulinType: InsulinType, notes?: string) => void;
  updateRecord: (id: string, dose: number, notes?: string) => void;
  getRecordsByDate: (date: Date) => InsulinDose[];
  getRecordsInRange: (start: Date, end: Date) => InsulinDose[];
  getSlotRecord: (slot: TreatmentSlot, date?: Date) => InsulinDose | undefined;
  getTodaySlotRecords: (slots: TreatmentSlot[]) => Map<string, InsulinDose>;
}

// Parse scheduled time (HH:MM:SS) to get the hour window
function getTimeWindow(scheduledTime: string): { start: number; end: number } {
  const hours = parseInt(scheduledTime.split(':')[0], 10);
  // Allow 1 hour before and 2 hours after scheduled time
  return { 
    start: Math.max(0, hours - 1), 
    end: Math.min(23, hours + 2) 
  };
}

// Check if a record matches a slot based on time window and insulin type
function recordMatchesSlot(record: InsulinDose, slot: TreatmentSlot): boolean {
  // Must match insulin type
  if (slot.insulinType && record.type !== slot.insulinType) {
    return false;
  }

  const recordHour = parseISO(record.timestamp).getHours();
  const window = getTimeWindow(slot.scheduledTime);
  
  return recordHour >= window.start && recordHour <= window.end;
}

export function useInsulinLog(initialRecords: InsulinDose[] = []): UseInsulinLogReturn {
  const [records, setRecords] = useState<InsulinDose[]>(initialRecords);

  // Get records for a specific date
  const getRecordsByDate = useCallback((date: Date): InsulinDose[] => {
    return records.filter(record => {
      const recordDate = parseISO(record.timestamp);
      return isSameDay(recordDate, date);
    }).sort((a, b) => parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime());
  }, [records]);

  // Get records within a date range
  const getRecordsInRange = useCallback((start: Date, end: Date): InsulinDose[] => {
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

  // Get a specific slot record for a given date
  const getSlotRecord = useCallback((slot: TreatmentSlot, date: Date = new Date()): InsulinDose | undefined => {
    const dayRecords = getRecordsByDate(date);
    
    // Find the most recent record that matches this slot
    const matchingRecords = dayRecords.filter(record => recordMatchesSlot(record, slot));
    
    // Return the most recent one
    return matchingRecords.length > 0 
      ? matchingRecords[matchingRecords.length - 1] 
      : undefined;
  }, [getRecordsByDate]);

  // Get all slot records for today as a Map (slotId -> record)
  const getTodaySlotRecords = useCallback((slots: TreatmentSlot[]): Map<string, InsulinDose> => {
    const slotRecords = new Map<string, InsulinDose>();
    const today = new Date();
    
    slots.forEach(slot => {
      const record = getSlotRecord(slot, today);
      if (record) {
        slotRecords.set(slot.id, record);
      }
    });
    
    return slotRecords;
  }, [getSlotRecord]);

  // Add a new record
  const addRecord = useCallback((dose: number, insulinType: InsulinType, notes?: string) => {
    const newRecord: InsulinDose = {
      id: `insulin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dose,
      type: insulinType,
      timestamp: new Date().toISOString(),
      notes,
    };

    setRecords(prev => [...prev, newRecord]);
  }, []);

  // Update an existing record
  const updateRecord = useCallback((id: string, dose: number, notes?: string) => {
    setRecords(prev => prev.map(record => 
      record.id === id 
        ? { ...record, dose, notes, timestamp: new Date().toISOString() }
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
    getTodaySlotRecords,
  };
}
