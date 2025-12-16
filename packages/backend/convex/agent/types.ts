import { Id } from "../_generated/dataModel";

// ============================================
// Agent Response Types
// ============================================

export type AgentResponse = {
  success: boolean;
  message: string;
};

// ============================================
// Request Body Types (ElevenLabs format)
// ============================================

export type RequestBody = {
  patient_id?: string;
  value?: number;
  dose?: number;
  insulin_type?: "rapid" | "basal";
  hours?: number;
  quality?: number;
  level?: number;
  severity?: number;
  symptoms?: string[];
  duration_minutes?: number;
  notes?: string;
  // Nested formats that ElevenLabs might send
  glucometry_data?: { patient_id?: string; value?: number };
  insulin_data?: { patient_id?: string; dose?: number; insulin_type?: "rapid" | "basal" };
  sleep_data?: { patient_id?: string; hours?: number; quality?: number };
  stress_data?: { patient_id?: string; level?: number; notes?: string };
  dizziness_data?: {
    patient_id?: string;
    severity?: number;
    symptoms?: string[];
    duration_minutes?: number;
    notes?: string;
  };
};

// ============================================
// Initiate Call Types
// ============================================

export type InitiateCallResult = {
  success: boolean;
  callId: string;
  phoneNumber: string;
  patientName: string;
};

// ============================================
// Type Guards
// ============================================

export function isValidPatientId(id: unknown): id is Id<"patientProfiles"> {
  return typeof id === "string" && id.length > 0;
}
