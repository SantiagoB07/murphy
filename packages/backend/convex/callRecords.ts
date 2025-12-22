import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ============================================
// Constantes
// ============================================

const RETRY_DELAY_MS = 5 * 60 * 1000; // 5 minutos
const MAX_RETRIES = 3;
const MIN_CALL_DURATION = 20; // segundos
const FALLBACK_CHECK_DELAY_MS = 6 * 60 * 1000; // 6 minutos

// ============================================
// Queries
// ============================================

/**
 * Obtiene un callRecord por conversationId (para el webhook)
 */
export const getByConversationId = internalQuery({
  args: { conversationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("callRecords")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .first();
  },
});

/**
 * Obtiene un callRecord por ID
 */
export const getById = internalQuery({
  args: { id: v.id("callRecords") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Crea un nuevo registro de llamada y programa el check de fallback
 */
export const create = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    scheduleId: v.optional(v.id("aiCallSchedules")),
    conversationId: v.string(),
    alertType: v.optional(v.string()),
    retryCount: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("callRecords", {
      patientId: args.patientId,
      scheduleId: args.scheduleId,
      conversationId: args.conversationId,
      status: "initiated",
      retryCount: args.retryCount,
      alertType: args.alertType,
      createdAt: Date.now(),
    });

    // Programar verificación de fallback (6 minutos)
    const checkFuncId = await ctx.scheduler.runAfter(
      FALLBACK_CHECK_DELAY_MS,
      internal.callRecords.checkCallStatus,
      { callRecordId: id }
    );

    // Actualizar con el ID de la función programada
    await ctx.db.patch(id, { checkScheduledFunctionId: checkFuncId });

    console.log(`[callRecords.create] Created record ${id} for conversation ${args.conversationId}`);

    return id;
  },
});

/**
 * Maneja cuando una llamada se completa (webhook post_call_transcription)
 */
export const handleCallCompleted = internalMutation({
  args: {
    conversationId: v.string(),
    durationSeconds: v.number(),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("callRecords")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .first();

    if (!record) {
      console.log(`[handleCallCompleted] No record found for ${args.conversationId}`);
      return;
    }

    // Cancelar el check de fallback
    if (record.checkScheduledFunctionId) {
      await ctx.scheduler.cancel(record.checkScheduledFunctionId);
    }

    const isSuccessful = args.durationSeconds >= MIN_CALL_DURATION;
    const status = isSuccessful ? "completed" : "too_short";

    await ctx.db.patch(record._id, {
      status,
      durationSeconds: args.durationSeconds,
      completedAt: Date.now(),
      checkScheduledFunctionId: undefined,
    });

    console.log(`[handleCallCompleted] ${args.conversationId} -> ${status} (${args.durationSeconds}s)`);

    // Si la llamada fue muy corta, programar retry
    if (!isSuccessful && record.retryCount < MAX_RETRIES) {
      await ctx.scheduler.runAfter(
        RETRY_DELAY_MS,
        internal.agent.actions.retryCall,
        { callRecordId: record._id }
      );
      console.log(`[handleCallCompleted] Retry scheduled for ${record._id}`);
    }
  },
});

/**
 * Maneja cuando una llamada falla al iniciar (webhook call_initiation_failure)
 */
export const handleCallFailed = internalMutation({
  args: {
    conversationId: v.string(),
    failureReason: v.string(), // "busy" | "no-answer" | "unknown"
  },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("callRecords")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .first();

    if (!record) {
      console.log(`[handleCallFailed] No record found for ${args.conversationId}`);
      return;
    }

    // Cancelar el check de fallback
    if (record.checkScheduledFunctionId) {
      await ctx.scheduler.cancel(record.checkScheduledFunctionId);
    }

    const status = args.failureReason === "busy" ? "busy" : "no_answer";

    await ctx.db.patch(record._id, {
      status,
      completedAt: Date.now(),
      checkScheduledFunctionId: undefined,
    });

    console.log(`[handleCallFailed] ${args.conversationId} -> ${status}`);

    // Programar retry si no hemos llegado al máximo
    if (record.retryCount < MAX_RETRIES) {
      await ctx.scheduler.runAfter(
        RETRY_DELAY_MS,
        internal.agent.actions.retryCall,
        { callRecordId: record._id }
      );
      console.log(`[handleCallFailed] Retry scheduled for ${record._id}`);
    }
  },
});

/**
 * Verificación de fallback - se ejecuta 6 min después de iniciar la llamada
 * Si el status sigue en "initiated", significa que no llegó ningún webhook
 */
export const checkCallStatus = internalMutation({
  args: { callRecordId: v.id("callRecords") },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.callRecordId);

    if (!record) {
      console.log(`[checkCallStatus] Record ${args.callRecordId} not found`);
      return;
    }

    // Si ya no está en "initiated", el webhook llegó y lo procesó
    if (record.status !== "initiated") {
      console.log(`[checkCallStatus] Record ${args.callRecordId} already processed (${record.status})`);
      return;
    }

    // Aún está en "initiated" después de 6 min = algo falló
    await ctx.db.patch(args.callRecordId, {
      status: "failed",
      completedAt: Date.now(),
      checkScheduledFunctionId: undefined,
    });

    console.log(`[checkCallStatus] ${args.callRecordId} -> failed (no webhook received)`);

    // Programar retry si no hemos llegado al máximo
    if (record.retryCount < MAX_RETRIES) {
      await ctx.scheduler.runAfter(
        RETRY_DELAY_MS,
        internal.agent.actions.retryCall,
        { callRecordId: args.callRecordId }
      );
      console.log(`[checkCallStatus] Retry scheduled for ${args.callRecordId}`);
    }
  },
});
