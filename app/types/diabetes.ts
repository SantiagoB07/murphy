export type UserRole = 'patient' | 'coadmin' | 'doctor';

// View modes for glucose history
export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export const VIEW_MODE_LABELS: Record<ViewMode, string> = {
  daily: 'Diario',
  weekly: 'Semanal',
  monthly: 'Mensual',
  quarterly: 'Trimestral',
};

export type DiabetesType = 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY';

// Expanded GlucometryType with mealtime-specific types + legacy support
export type GlucometryType = 
  | 'before_breakfast' 
  | 'after_breakfast'
  | 'before_lunch' 
  | 'after_lunch'
  | 'before_dinner' 
  | 'after_dinner'
  // Legacy types for backward compatibility
  | 'fasting' 
  | 'preprandial' 
  | 'postprandial'
  | 'random' 
  | 'nocturnal';

export type InsulinType = 'rapid' | 'short' | 'intermediate' | 'basal' | 'mixed';

// Reminder types (formerly alerts)
export type ReminderType = 'glucose' | 'insulin' | 'medication';

// Labels in Spanish for each glucometry type
export const GLUCOMETRY_LABELS: Record<GlucometryType, string> = {
  before_breakfast: 'Antes del desayuno',
  after_breakfast: 'Después del desayuno',
  before_lunch: 'Antes del almuerzo',
  after_lunch: 'Después del almuerzo',
  before_dinner: 'Antes de la cena',
  after_dinner: 'Después de la cena',
  // Legacy labels
  fasting: 'En ayunas',
  preprandial: 'Preprandial',
  postprandial: 'Postprandial',
  random: 'Aleatorio',
  nocturnal: 'Nocturno',
};

// Glucose ranges for color coding
export const GLUCOSE_RANGES = {
  critical_low: 54,
  low: 70,
  normal: { min: 70, max: 140 },
  preprandial: { min: 70, max: 130 },
  postprandial: { max: 180 },
  high: 180,
  critical_high: 250,
} as const;

// The 6 meal time slots for daily tracking
export const MEAL_TIME_SLOTS = [
  { type: 'before_breakfast' as GlucometryType, label: 'Antes del desayuno', icon: 'Sunrise', period: 'breakfast' },
  { type: 'after_breakfast' as GlucometryType, label: 'Después del desayuno', icon: 'Coffee', period: 'breakfast' },
  { type: 'before_lunch' as GlucometryType, label: 'Antes del almuerzo', icon: 'Sun', period: 'lunch' },
  { type: 'after_lunch' as GlucometryType, label: 'Después del almuerzo', icon: 'Utensils', period: 'lunch' },
  { type: 'before_dinner' as GlucometryType, label: 'Antes de la cena', icon: 'Sunset', period: 'dinner' },
  { type: 'after_dinner' as GlucometryType, label: 'Después de la cena', icon: 'Moon', period: 'dinner' },
] as const;

// Helper to get glucose status
export function getGlucoseStatus(value: number): 'critical_low' | 'low' | 'normal' | 'high' | 'critical_high' {
  if (value < GLUCOSE_RANGES.critical_low) return 'critical_low';
  if (value < GLUCOSE_RANGES.low) return 'low';
  if (value <= GLUCOSE_RANGES.high) return 'normal';
  if (value <= GLUCOSE_RANGES.critical_high) return 'high';
  return 'critical_high';
}

export interface Glucometry {
  id: string;
  value: number;
  timestamp: string;
  type: GlucometryType;
  notes?: string;
}

export interface InsulinDose {
  id: string;
  dose: number; // Changed from 'units' to match DB schema
  type: InsulinType;
  timestamp: string;
  notes?: string;
}

export interface InsulinSchedule {
  type: 'rapid' | 'basal';
  timesPerDay: number;
  unitsPerDose: number;
}

// Simplified SleepRecord - only hours, no quality
export interface SleepRecord {
  id: string;
  hours: number;
  date: string;
}

// Simplified to boolean symptom log (matches DB symptom_logs table)
export interface SymptomLog {
  id: string;
  symptom_type: 'stress' | 'dizziness';
  value: boolean;
  date: string;
}

// Reminder interface (formerly Alert - matches DB alerts table)
export interface Reminder {
  id: string;
  alert_type: string;
  scheduled_time: string;
  enabled: boolean;
  channel: string;
}

// Treatment schedule slot - defines when patient should measure glucose or apply insulin
export type TreatmentType = 'glucose' | 'insulin';

export interface TreatmentSlot {
  id: string;
  type: TreatmentType;
  scheduledTime: string;        // "HH:MM:SS"
  label: string | null;         // "Antes del desayuno", "Rápida Almuerzo"
  expectedDose: number | null;  // Solo para insulin
  insulinType: InsulinType | null; // Solo para insulin: 'rapid' | 'basal'
  enabled: boolean;
}

// Helper to get icon based on scheduled time
export function getTimeSlotIcon(scheduledTime: string): string {
  const hours = parseInt(scheduledTime.split(':')[0], 10);
  
  if (hours >= 5 && hours < 9) return 'Sunrise';
  if (hours >= 9 && hours < 12) return 'Coffee';
  if (hours >= 12 && hours < 14) return 'Sun';
  if (hours >= 14 && hours < 18) return 'Utensils';
  if (hours >= 18 && hours < 21) return 'Sunset';
  return 'Moon';
}

// Helper to get default label based on scheduled time
export function getTimeSlotLabel(scheduledTime: string): string {
  const hours = parseInt(scheduledTime.split(':')[0], 10);
  
  if (hours >= 5 && hours < 9) return 'Mañana';
  if (hours >= 9 && hours < 12) return 'Media mañana';
  if (hours >= 12 && hours < 14) return 'Mediodía';
  if (hours >= 14 && hours < 18) return 'Tarde';
  if (hours >= 18 && hours < 21) return 'Noche';
  return 'Nocturno';
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  diabetesType: DiabetesType;
  estrato: number;
  avatar: string | null;
  telegramConnected: boolean;
  coadminId: string | null;
  glucometrias: Glucometry[];
  insulina: InsulinDose[];
  sueno: SleepRecord[];
  // Simplified wellness - just booleans
  hasStressToday?: boolean;
  hasDizzinessToday?: boolean;
  recordatorios: Reminder[];
  // Treatment schedule - configured slots for glucose and insulin
  treatmentSchedule: TreatmentSlot[];
}

export interface Coadmin {
  id: string;
  name: string;
  patientId: string;
  telegramConnected: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  licenseNumber: string;
  avatar: string | null;
  patientIds: string[];
}

export interface AIReportSummary {
  avgGlucose: number;
  stdDev: number;
  hypoCount: number;
  hyperCount: number;
  timeInRange: number;
  trend: 'improving' | 'stable' | 'deteriorating';
}

export interface AIReport {
  id: string;
  patientId: string;
  generatedAt: string;
  summary: AIReportSummary;
  recommendations: string[];
  pdfUrl?: string;
}

// User settings types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  phone?: string;
  diabetesType: DiabetesType;
}

export interface NotificationPreferences {
  glucoseAlerts: boolean;
  hypoglycemiaAlerts: boolean;
  hyperglycemiaAlerts: boolean;
  medicationReminders: boolean;
  measurementReminders: boolean;
  dailySummary: boolean;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  brand: string;
  model: string;
  connectedAt: string;
  lastSync?: string;
  batteryLevel?: number;
}

export interface MockData {
  patients: Patient[];
  coadmins: Coadmin[];
  doctors: Doctor[];
  aiReports: AIReport[];
}
