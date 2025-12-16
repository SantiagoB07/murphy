import { Id } from "../_generated/dataModel";

// ============================================
// Agent Response Types
// ============================================

export type AgentResponse = {
  success: boolean;
  message: string;
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
