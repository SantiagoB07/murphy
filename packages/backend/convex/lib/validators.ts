import { v } from "convex/values";

// ============================================
// Shared Type Validators
// ============================================

/**
 * Diabetes type classification
 */
export const diabetesTypes = v.union(
  v.literal("Tipo 1"),
  v.literal("Tipo 2"),
  v.literal("Gestacional"),
  v.literal("LADA"),
  v.literal("MODY")
);

/**
 * Gender options
 */
export const genderTypes = v.union(
  v.literal("masculino"),
  v.literal("femenino"),
  v.literal("otro"),
  v.literal("prefiero_no_decir")
);

/**
 * Insulin type classification
 */
export const insulinTypes = v.union(
  v.literal("rapid"),
  v.literal("basal")
);

/**
 * User role types
 */
export const userRoles = v.union(
  v.literal("patient"),
  v.literal("coadmin")
);

/**
 * Schedule type for AI calls
 */
export const scheduleTypes = v.union(
  v.literal("recurring"),
  v.literal("specific")
);

/**
 * Notification channel options
 */
export const notificationChannels = v.union(
  v.literal("call"),
  v.literal("whatsapp")
);

/**
 * Treatment slot types
 */
export const slotTypes = v.union(
  v.literal("glucose"),
  v.literal("insulin")
);

// ============================================
// TypeScript Type Exports (inferred from validators)
// ============================================

export type DiabetesType = "Tipo 1" | "Tipo 2" | "Gestacional" | "LADA" | "MODY";
export type GenderType = "masculino" | "femenino" | "otro" | "prefiero_no_decir";
export type InsulinType = "rapid" | "basal";
export type UserRole = "patient" | "coadmin";
export type ScheduleType = "recurring" | "specific";
export type NotificationChannel = "call" | "whatsapp";
export type SlotType = "glucose" | "insulin";

// ============================================
// Validation Helpers
// ============================================

/**
 * Validates that a string is a valid insulin type
 */
export function isValidInsulinType(type: unknown): type is InsulinType {
  return type === "rapid" || type === "basal";
}

/**
 * Gets today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Gets current time in HH:MM format
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().split(" ")[0].slice(0, 5);
}

/**
 * Calculates start and end timestamps for a given date
 */
export function getDateRange(date: string): { startOfDay: number; endOfDay: number } {
  const startOfDay = new Date(date + "T00:00:00").getTime();
  const endOfDay = new Date(date + "T23:59:59.999").getTime();
  return { startOfDay, endOfDay };
}

/**
 * Formats a timestamp as a relative time string in Spanish
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `hace ${diffMins} min`;
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "ayer";
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`;
  } else {
    const date = new Date(timestamp);
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  }
}
