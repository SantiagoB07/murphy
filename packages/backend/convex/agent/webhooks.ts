import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";

/**
 * HTTP Action para recibir webhooks de ElevenLabs
 * Endpoint: POST /api/agent/webhook/elevenlabs
 *
 * Tipos de webhook manejados:
 * - post_call_transcription: Cuando la llamada termina exitosamente
 * - call_initiation_failure: Cuando la llamada no se puede iniciar (no contestan, ocupado, etc.)
 */
export const httpElevenLabsWebhook = httpAction(async (ctx, request) => {
  try {
    const body = await request.json();

    console.log(`[ElevenLabs Webhook] Received: ${body.type}`);

    if (body.type === "post_call_transcription") {
      const { conversation_id, metadata } = body.data;
      const durationSeconds = metadata?.call_duration_secs ?? 0;

      console.log(`[ElevenLabs Webhook] Transcription for ${conversation_id}, duration: ${durationSeconds}s`);

      await ctx.runMutation(internal.callRecords.handleCallCompleted, {
        conversationId: conversation_id,
        durationSeconds,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.type === "call_initiation_failure") {
      const { conversation_id, failure_reason } = body.data;

      console.log(`[ElevenLabs Webhook] Call failed for ${conversation_id}, reason: ${failure_reason}`);

      await ctx.runMutation(internal.callRecords.handleCallFailed, {
        conversationId: conversation_id,
        failureReason: failure_reason ?? "unknown",
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Tipo de webhook no manejado (ej: post_call_audio)
    console.log(`[ElevenLabs Webhook] Unhandled type: ${body.type}`);
    return new Response(JSON.stringify({ status: "ok", message: "unhandled type" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ElevenLabs Webhook] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
