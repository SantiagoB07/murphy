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

// ============================================
// Colombia Timezone Helpers
// ============================================

/**
 * Colombia timezone offset in milliseconds (UTC-5, no DST)
 */
export const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000;

/**
 * Gets the current time as a Date object adjusted to Colombia timezone (UTC-5)
 * Note: The returned Date object's internal UTC time is shifted to represent Colombia local time
 */
export function getNowInColombia(): Date {
  const nowUtc = Date.now();
  return new Date(nowUtc + COLOMBIA_OFFSET_MS);
}

/**
 * Gets today's date in YYYY-MM-DD format using Colombia timezone
 */
export function getTodayDate(): string {
  const nowColombia = getNowInColombia();
  const year = nowColombia.getUTCFullYear();
  const month = String(nowColombia.getUTCMonth() + 1).padStart(2, "0");
  const day = String(nowColombia.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Gets current time in HH:MM format using Colombia timezone
 */
export function getCurrentTime(): string {
  const nowColombia = getNowInColombia();
  const hours = String(nowColombia.getUTCHours()).padStart(2, "0");
  const minutes = String(nowColombia.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Calculates start and end timestamps for a given date in Colombia timezone
 * The date string is interpreted as Colombia local date
 * Returns UTC timestamps that correspond to midnight and end of day in Colombia
 */
export function getDateRange(date: string): { startOfDay: number; endOfDay: number } {
  // Parse the date as Colombia midnight (00:00:00 Colombia time)
  // Colombia is UTC-5, so midnight Colombia = 05:00:00 UTC
  const [year, month, day] = date.split("-").map(Number);
  
  // Create date at midnight UTC, then subtract Colombia offset to get Colombia midnight in UTC
  const midnightColombia = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const startOfDay = midnightColombia.getTime() - COLOMBIA_OFFSET_MS;
  
  // End of day is 23:59:59.999 Colombia time
  const endOfDayColombia = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
  const endOfDay = endOfDayColombia.getTime() - COLOMBIA_OFFSET_MS;
  
  return { startOfDay, endOfDay };
}

/**
 * Gets start of day timestamp for a given timestamp in Colombia timezone
 * Returns UTC timestamp for midnight Colombia time of that day
 */
export function getStartOfDayColombia(timestamp: number): number {
  // Convert UTC timestamp to Colombia "local" time
  const colombiaTime = new Date(timestamp + COLOMBIA_OFFSET_MS);
  
  // Get the date components in Colombia time
  const year = colombiaTime.getUTCFullYear();
  const month = colombiaTime.getUTCMonth();
  const day = colombiaTime.getUTCDate();
  
  // Create midnight in Colombia, then convert back to UTC
  const midnightColombia = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return midnightColombia.getTime() - COLOMBIA_OFFSET_MS;
}

/**
 * Gets end of day timestamp for a given timestamp in Colombia timezone
 * Returns UTC timestamp for 23:59:59.999 Colombia time of that day
 */
export function getEndOfDayColombia(timestamp: number): number {
  // Convert UTC timestamp to Colombia "local" time
  const colombiaTime = new Date(timestamp + COLOMBIA_OFFSET_MS);
  
  // Get the date components in Colombia time
  const year = colombiaTime.getUTCFullYear();
  const month = colombiaTime.getUTCMonth();
  const day = colombiaTime.getUTCDate();
  
  // Create end of day in Colombia, then convert back to UTC
  const endOfDayColombia = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  return endOfDayColombia.getTime() - COLOMBIA_OFFSET_MS;
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
