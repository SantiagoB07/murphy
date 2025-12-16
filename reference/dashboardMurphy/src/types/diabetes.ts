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

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertType = 'hypoglycemia' | 'hyperglycemia' | 'missed_dose' | 'pattern' | 'streak' | 'reminder';

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
  units: number;
  type: InsulinType;
  timestamp: string;
  notes?: string;
}

// Insulin schedule with full tracking support
export interface InsulinSchedule {
  id: string;
  patientId: string;
  type: 'rapid' | 'basal';
  timesPerDay: number;
  unitsPerDose: number;
  brand?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  changeReason?: string;
  orderedBy?: string;
  changedByUserId?: string;
  changedByRole?: 'patient' | 'coadmin';
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Insulin brands for dropdowns
export const RAPID_INSULIN_BRANDS = [
  'Humalog (Lispro)',
  'NovoRapid (Aspart)',
  'Apidra (Glulisina)',
  'Fiasp',
  'Lyumjev',
  'Otra',
] as const;

export const BASAL_INSULIN_BRANDS = [
  'Lantus (Glargina U100)',
  'Toujeo (Glargina U300)',
  'Levemir (Detemir)',
  'Tresiba (Degludec)',
  'Basaglar',
  'Otra',
] as const;

export interface SleepRecord {
  id: string;
  hours: number;
  quality: number; // 1-10
  date: string;
}

export interface StressRecord {
  id: string;
  level: number; // 1-10
  timestamp: string;
  notes?: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  resolved: boolean;
}

// Dizziness types
export type DizzinessSymptom = 'nausea' | 'vision_blur' | 'weakness' | 'sweating' | 'confusion' | 'headache';

export const DIZZINESS_SYMPTOMS_LABELS: Record<DizzinessSymptom, string> = {
  nausea: 'Náuseas',
  vision_blur: 'Visión borrosa',
  weakness: 'Debilidad',
  sweating: 'Sudoración',
  confusion: 'Confusión',
  headache: 'Dolor de cabeza',
};

export const DIZZINESS_SEVERITY_LABELS = ['Leve', 'Moderado', 'Notable', 'Fuerte', 'Severo'];
export const DIZZINESS_SEVERITY_EMOJIS = ['😵‍💫', '🌀', '💫', '🤕', '🆘'];

export interface DizzinessRecord {
  id: string;
  severity: number; // 1-5
  timestamp: string;
  duration?: number; // minutes
  symptoms?: DizzinessSymptom[];
  notes?: string;
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
  xpLevel: number;
  streak: number;
  glucometrias: Glucometry[];
  insulina: InsulinDose[];
  sueno: SleepRecord[];
  estres: StressRecord[];
  mareos?: DizzinessRecord[];
  alertas: Alert[];
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

// XP System types
export interface DailyXPLog {
  date: string;
  baseXP: number;
  finalXP: number;
  slotsCompleted: number;
  inRangePercent: number;
  streakDays: number;
  streakMultiplier: number;
}

// AI Call Schedule types
export type AICallPurpose = 'glucose' | 'wellness' | 'insulin' | 'reminder';

export const AI_CALL_PURPOSE_LABELS: Record<AICallPurpose, string> = {
  glucose: 'Registro de glucosa',
  wellness: 'Bienestar (sueño, estrés)',
  insulin: 'Recordatorio de insulina',
  reminder: 'Recordatorio general',
};

export const DAYS_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
};

export type ScheduleType = 'recurring' | 'specific';

export type NotificationChannel = 'call' | 'whatsapp';

export const NOTIFICATION_CHANNEL_OPTIONS = [
  { value: 'call' as const, label: 'Llamada' },
  { value: 'whatsapp' as const, label: 'WhatsApp' },
] as const;

export interface AICallSchedule {
  id: string;
  patientId: string;
  scheduledByUserId: string;
  scheduledByRole: 'patient' | 'coadmin';
  scheduleType: ScheduleType;
  callTime: string; // HH:MM format
  daysOfWeek: number[]; // 1-7 where 1=Monday (for recurring)
  specificDates?: string[]; // YYYY-MM-DD (for specific)
  callPurposes: AICallPurpose[];
  customMessage?: string;
  notificationChannel: NotificationChannel;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
