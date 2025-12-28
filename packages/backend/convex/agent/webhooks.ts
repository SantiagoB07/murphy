import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { verifyElevenLabsSignature } from "./helpers";

/**
 * HTTP Action para recibir webhooks de ElevenLabs con verificación HMAC
 * Endpoint: POST /api/agent/webhook/elevenlabs
 *
 * Autenticación:
 * - Verifica firma HMAC-SHA256 usando el header "ElevenLabs-Signature"
 * - Valida que el timestamp no sea mayor a 30 minutos (replay protection)
 *
 * Tipos de webhook manejados:
 * - post_call_transcription: Cuando la llamada termina exitosamente
 * - call_initiation_failure: Cuando la llamada no se puede iniciar (no contestan, ocupado, etc.)
 */
export const httpElevenLabsWebhook = httpAction(async (ctx, request) => {
  try {
    // Step 1: Get raw body for signature verification (must be done before parsing)
    const rawBody = await request.text();

    // Step 2: Get signature header (HTTP headers are case-insensitive)
    const signatureHeader = request.headers.get("elevenlabs-signature");

    // Step 3: Get webhook secret from environment
    const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    // Step 4: Verify HMAC signature
    const verificationResult = await verifyElevenLabsSignature(
      rawBody,
      signatureHeader,
      secret
    );

    if (!verificationResult.success) {
      console.error(`[ElevenLabs Webhook] Auth failed: ${verificationResult.error}`);
      return new Response(JSON.stringify({ error: verificationResult.error }), {
        status: verificationResult.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 5: Parse JSON body (signature verified, safe to process)
    let body: { type?: string; data?: { conversation_id?: string; metadata?: { call_duration_secs?: number }; failure_reason?: string } };
    try {
      body = JSON.parse(rawBody);
    } catch {
      console.error("[ElevenLabs Webhook] Invalid JSON body");
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`[ElevenLabs Webhook] Received: ${body.type}`);

    // Step 6: Process webhook based on type
    if (body.type === "post_call_transcription") {
      const conversationId = body.data?.conversation_id;
      const durationSeconds = body.data?.metadata?.call_duration_secs ?? 0;

      console.log(`[ElevenLabs Webhook] Transcription for ${conversationId}, duration: ${durationSeconds}s`);

      await ctx.runMutation(internal.callRecords.handleCallCompleted, {
        conversationId: conversationId ?? "",
        durationSeconds,
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.type === "call_initiation_failure") {
      const conversationId = body.data?.conversation_id;
      const failureReason = body.data?.failure_reason;

      console.log(`[ElevenLabs Webhook] Call failed for ${conversationId}, reason: ${failureReason}`);

      await ctx.runMutation(internal.callRecords.handleCallFailed, {
        conversationId: conversationId ?? "",
        failureReason: failureReason ?? "unknown",
      });

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unhandled webhook type (e.g., post_call_audio)
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
