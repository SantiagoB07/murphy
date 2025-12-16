import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

// ============================================
// Types
// ============================================

export type NotificationPreferencesInput = {
  clerkUserId: string;
  glucoseAlerts?: boolean;
  hypoglycemiaAlerts?: boolean;
  hyperglycemiaAlerts?: boolean;
  medicationReminders?: boolean;
  measurementReminders?: boolean;
  dailySummary?: boolean;
};

export type NotificationPreferencesUpdate = {
  glucoseAlerts?: boolean;
  hypoglycemiaAlerts?: boolean;
  hyperglycemiaAlerts?: boolean;
  medicationReminders?: boolean;
  measurementReminders?: boolean;
  dailySummary?: boolean;
};

export type NotificationPreferences = {
  glucoseAlerts: boolean;
  hypoglycemiaAlerts: boolean;
  hyperglycemiaAlerts: boolean;
  medicationReminders: boolean;
  measurementReminders: boolean;
  dailySummary: boolean;
  updatedAt: number;
};

// ============================================
// Default Preferences
// ============================================

/**
 * Returns default notification preferences
 */
export function getDefaultPreferences(): NotificationPreferences {
  return {
    glucoseAlerts: true,
    hypoglycemiaAlerts: true,
    hyperglycemiaAlerts: true,
    medicationReminders: true,
    measurementReminders: true,
    dailySummary: false,
    updatedAt: Date.now(),
  };
}

// ============================================
// Load Operations
// ============================================

/**
 * Loads notification preferences by Clerk user ID
 * Returns null if not found
 */
export async function loadByClerkUserId(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string
): Promise<Doc<"notificationPreferences"> | null> {
  return ctx.db
    .query("notificationPreferences")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

/**
 * Gets notification preferences for a user, returning defaults if none exist
 */
export async function getPreferencesOrDefaults(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string
): Promise<NotificationPreferences> {
  const prefs = await loadByClerkUserId(ctx, clerkUserId);
  if (!prefs) {
    return getDefaultPreferences();
  }
  return {
    glucoseAlerts: prefs.glucoseAlerts,
    hypoglycemiaAlerts: prefs.hypoglycemiaAlerts,
    hyperglycemiaAlerts: prefs.hyperglycemiaAlerts,
    medicationReminders: prefs.medicationReminders,
    measurementReminders: prefs.measurementReminders,
    dailySummary: prefs.dailySummary,
    updatedAt: prefs.updatedAt,
  };
}

// ============================================
// Create Operations
// ============================================

/**
 * Initializes default notification preferences for a new user
 * Returns existing preferences if they already exist
 */
export async function initializePreferences(
  ctx: MutationCtx,
  clerkUserId: string
): Promise<{ id: Id<"notificationPreferences"> }> {
  // Check if preferences already exist
  const existing = await loadByClerkUserId(ctx, clerkUserId);
  if (existing) {
    return { id: existing._id };
  }

  // Create default preferences
  const defaults = getDefaultPreferences();
  const id = await ctx.db.insert("notificationPreferences", {
    clerkUserId,
    ...defaults,
  });

  return { id };
}

// ============================================
// Update Operations
// ============================================

/**
 * Updates notification preferences for a user
 * Creates preferences if they don't exist
 */
export async function updatePreferences(
  ctx: MutationCtx,
  { clerkUserId, ...updates }: { clerkUserId: string } & NotificationPreferencesUpdate
): Promise<{ id: Id<"notificationPreferences"> }> {
  const existing = await loadByClerkUserId(ctx, clerkUserId);

  if (existing) {
    // Update existing preferences
    await ctx.db.patch(existing._id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return { id: existing._id };
  }

  // Create new preferences with defaults and overrides
  const defaults = getDefaultPreferences();
  const id = await ctx.db.insert("notificationPreferences", {
    clerkUserId,
    glucoseAlerts: updates.glucoseAlerts ?? defaults.glucoseAlerts,
    hypoglycemiaAlerts: updates.hypoglycemiaAlerts ?? defaults.hypoglycemiaAlerts,
    hyperglycemiaAlerts: updates.hyperglycemiaAlerts ?? defaults.hyperglycemiaAlerts,
    medicationReminders: updates.medicationReminders ?? defaults.medicationReminders,
    measurementReminders: updates.measurementReminders ?? defaults.measurementReminders,
    dailySummary: updates.dailySummary ?? defaults.dailySummary,
    updatedAt: Date.now(),
  });

  return { id };
}
