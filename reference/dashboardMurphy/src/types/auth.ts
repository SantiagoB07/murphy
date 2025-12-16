import { User, Session } from '@supabase/supabase-js';
import { UserRole, DiabetesType } from './diabetes';

export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  gender: Gender | null;
  id_number: string | null;
  birth_date: string | null;
  diabetes_type: DiabetesType;
  diagnosis_year: number | null;
  city: string | null;
  estrato: number | null;
  coadmin_name: string | null;
  coadmin_phone: string | null;
  coadmin_email: string | null;
  xp_level: number;
  streak: number;
  created_at: string;
  updated_at: string;
}

export interface PatientRegistrationData {
  // Step 1: Credentials
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2: Personal Data
  fullName: string;
  phone: string;
  birthDate: Date;
  gender: Gender;
  idNumber: string;
  // Step 3: Medical Info & Location
  diabetesType: DiabetesType;
  diagnosisYear: number;
  city: string;
  estrato: number;
  // Step 4: Co-admin (optional)
  coadminName?: string;
  coadminPhone?: string;
  coadminEmail?: string;
  noCoadmin?: boolean;
}

export interface CoadminProfile {
  id: string;
  user_id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
}

export interface CoadminRegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  patientId: string;
}

export interface CoadminEmailCheckResult {
  patient_profile_id: string;
  patient_name: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: Profile | null;
  patientProfile: PatientProfile | null;
  coadminProfile: CoadminProfile | null;
  isLoading: boolean;
  isDemoMode: boolean;
  demoRole: UserRole | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (data: PatientRegistrationData) => Promise<{ error: Error | null }>;
  signUpAsCoadmin: (data: CoadminRegistrationData) => Promise<{ error: Error | null }>;
  checkCoadminEmail: (email: string) => Promise<CoadminEmailCheckResult | null>;
  signOut: () => Promise<void>;
  enterDemoMode: (role: UserRole) => void;
  exitDemoMode: () => void;
  refreshProfile: () => Promise<void>;
}
