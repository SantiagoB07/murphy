import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

// ============================================
// Queries
// ============================================

/**
 * Gets notification preferences for current user
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx)

    const prefs = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", patient.clerkUserId))
      .unique()

    // Return default preferences if none exist
    if (!prefs) {
      return {
        glucoseAlerts: true,
        hypoglycemiaAlerts: true,
        hyperglycemiaAlerts: true,
        medicationReminders: true,
        measurementReminders: true,
        dailySummary: false,
        updatedAt: Date.now(),
      }
    }

    return prefs
  },
})

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
    const patient = await getCurrentPatient(ctx)

    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", patient.clerkUserId))
      .unique()

    if (existing) {
      // Update existing preferences
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      })
    } else {
      // Create new preferences
      await ctx.db.insert("notificationPreferences", {
        clerkUserId: patient.clerkUserId,
        glucoseAlerts: args.glucoseAlerts ?? true,
        hypoglycemiaAlerts: args.hypoglycemiaAlerts ?? true,
        hyperglycemiaAlerts: args.hyperglycemiaAlerts ?? true,
        medicationReminders: args.medicationReminders ?? true,
        measurementReminders: args.measurementReminders ?? true,
        dailySummary: args.dailySummary ?? false,
        updatedAt: Date.now(),
      })
    }

    return { success: true }
  },
})

/**
 * Initializes default notification preferences for a new user
 * Called internally from user creation flow
 */
export const initialize = internalMutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if preferences already exist
    const existing = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique()

    if (existing) {
      return { id: existing._id }
    }

    // Create default preferences
    const prefsId = await ctx.db.insert("notificationPreferences", {
      clerkUserId: args.clerkUserId,
      glucoseAlerts: true,
      hypoglycemiaAlerts: true,
      hyperglycemiaAlerts: true,
      medicationReminders: true,
      measurementReminders: true,
      dailySummary: false,
      updatedAt: Date.now(),
    })

    return { id: prefsId }
  },
})
