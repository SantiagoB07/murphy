import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

export const getConversationByPhone = internalQuery({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    return await ctx.db
      .query("kapsoConversations")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumber))
      .first();
  },
});

/**
 * Crea un nuevo thread de Convex Agent y lo guarda en la base de datos.
 * Incluye verificación de duplicados para prevenir race conditions.
 * Esta función DEBE llamarse desde un action porque createThread lo requiere
 */
export const createConversation = internalMutation({
  args: {
    phoneNumber: v.string(),
    kapsoConversationId: v.string(),
    convexThreadId: v.string(),
    patientId: v.optional(v.id("patientProfiles")),
  },
  handler: async (ctx, args) => {
    // Check for existing conversation to prevent race condition duplicates
    const existing = await ctx.db
      .query("kapsoConversations")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    if (existing) {
      return {
        conversationId: existing._id,
        convexThreadId: existing.convexThreadId,
        isNew: false,
      };
    }

    const conversationId = await ctx.db.insert("kapsoConversations", {
      phoneNumber: args.phoneNumber,
      kapsoConversationId: args.kapsoConversationId,
      convexThreadId: args.convexThreadId,
      patientId: args.patientId,
      lastMessageAt: Date.now(),
      isActive: true,
    });

    return {
      conversationId,
      convexThreadId: args.convexThreadId,
      isNew: true,
    };
  },
});

/**
 * Actualiza el timestamp del último mensaje de una conversación
 */
export const updateConversationTimestamp = internalMutation({
  args: { phoneNumber: v.string() },
  handler: async (ctx, { phoneNumber }) => {
    const conversation = await ctx.db
      .query("kapsoConversations")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumber))
      .first();

    if (conversation) {
      await ctx.db.patch(conversation._id, {
        lastMessageAt: Date.now(),
      });
    }
  },
});

/**
 * Asocia un paciente a una conversación existente
 */
export const linkPatientToConversation = internalMutation({
  args: {
    phoneNumber: v.string(),
    patientId: v.id("patientProfiles"),
  },
  handler: async (ctx, { phoneNumber, patientId }) => {
    const conversation = await ctx.db
      .query("kapsoConversations")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", phoneNumber))
      .first();

    if (conversation) {
      await ctx.db.patch(conversation._id, { patientId });
    }
  },
});
