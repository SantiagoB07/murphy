import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentPatient } from "./lib/auth"

const slotTypes = v.union(v.literal("glucose"), v.literal("insulin"))
const insulinTypes = v.union(v.literal("rapid"), v.literal("basal"))

// ============================================
// Queries
// ============================================

/**
 * Lists treatment slots with optional filtering
 */
export const list = query({
  args: {
    type: v.optional(slotTypes),
    enabledOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    let slots = await ctx.db
      .query("treatmentSlots")
      .withIndex("by_patient_type", (q) => {
        if (args.type) {
          return q.eq("patientId", patient._id).eq("type", args.type)
        }
        return q.eq("patientId", patient._id)
      })
      .collect()

    if (args.enabledOnly) {
      slots = slots.filter((s) => s.isEnabled)
    }

    // Sort by scheduled time
    slots.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

    return slots
  },
})

/**
 * Lists slots by type (convenience method)
 */
export const listByType = query({
  args: {
    type: slotTypes,
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const slots = await ctx.db
      .query("treatmentSlots")
      .withIndex("by_patient_type", (q) =>
        q.eq("patientId", patient._id).eq("type", args.type)
      )
      .filter((q) => q.eq(q.field("isEnabled"), true))
      .collect()

    // Sort by scheduled time
    slots.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

    return slots
  },
})

/**
 * Gets a single treatment slot by ID
 */
export const getById = query({
  args: {
    id: v.id("treatmentSlots"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const slot = await ctx.db.get(args.id)

    if (!slot) {
      throw new Error("Slot not found")
    }

    // Verify ownership
    if (slot.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    return slot
  },
})

// ============================================
// Mutations
// ============================================

/**
 * Creates a new treatment slot
 */
export const create = mutation({
  args: {
    type: slotTypes,
    scheduledTime: v.string(), // "HH:MM"
    label: v.optional(v.string()),
    expectedDose: v.optional(v.number()),
    insulinType: v.optional(insulinTypes),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)

    const slotId = await ctx.db.insert("treatmentSlots", {
      patientId: patient._id,
      type: args.type,
      scheduledTime: args.scheduledTime,
      label: args.label,
      expectedDose: args.expectedDose,
      insulinType: args.insulinType,
      isEnabled: args.isEnabled ?? true,
      updatedAt: Date.now(),
    })

    return { id: slotId }
  },
})

/**
 * Updates a treatment slot
 */
export const update = mutation({
  args: {
    id: v.id("treatmentSlots"),
    scheduledTime: v.optional(v.string()),
    label: v.optional(v.string()),
    expectedDose: v.optional(v.number()),
    insulinType: v.optional(insulinTypes),
    isEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const slot = await ctx.db.get(args.id)

    if (!slot) {
      throw new Error("Slot not found")
    }

    // Verify ownership
    if (slot.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    const { id, ...updates } = args

    await ctx.db.patch(args.id, {
      ...updates,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Toggles enabled status
 */
export const toggle = mutation({
  args: {
    id: v.id("treatmentSlots"),
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const slot = await ctx.db.get(args.id)

    if (!slot) {
      throw new Error("Slot not found")
    }

    // Verify ownership
    if (slot.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.id, {
      isEnabled: args.isEnabled,
      updatedAt: Date.now(),
    })

    return { success: true }
  },
})

/**
 * Deletes a treatment slot
 */
export const remove = mutation({
  args: {
    id: v.id("treatmentSlots"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx)
    const slot = await ctx.db.get(args.id)

    if (!slot) {
      throw new Error("Slot not found")
    }

    // Verify ownership
    if (slot.patientId !== patient._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.id)

    return { success: true }
  },
})
