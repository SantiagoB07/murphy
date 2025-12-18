import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentPatient } from "./lib/auth";
import * as Notifications from "./model/notifications";

// ============================================
// Queries
// ============================================

/**
 * Gets notification preferences for current user
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx);
    return Notifications.getPreferencesOrDefaults(ctx, patient.clerkUserId);
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Updates notification preferences
 */
export const update = mutation({
  args: {
    glucoseAlerts: v.optional(v.boolean()),
    hypoglycemiaAlerts: v.optional(v.boolean()),
    hyperglycemiaAlerts: v.optional(v.boolean()),
    medicationReminders: v.optional(v.boolean()),
    measurementReminders: v.optional(v.boolean()),
    dailySummary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);
    return Notifications.updatePreferences(ctx, {
      clerkUserId: patient.clerkUserId,
      ...args,
    });
  },
});

/**
 * Initializes default notification preferences for a new user
 * Called internally from user creation flow
 */
export const initialize = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    return Notifications.initializePreferences(ctx, args.clerkUserId);
  },
});
