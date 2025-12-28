import { z } from "zod";
import type { AgentResponse } from "./types";

// ============================================
// Signature Verification Helpers
// ============================================

/**
 * Constant-time string comparison to prevent timing attacks.
 * Always compares all characters regardless of early mismatches.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still do a dummy comparison to maintain constant time
    let dummy = 0;
    for (let i = 0; i < a.length; i++) {
      dummy |= a.charCodeAt(i) ^ a.charCodeAt(i);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Verifies the ElevenLabs webhook signature using HMAC-SHA256.
 *
 * ElevenLabs signature header format: "t=timestamp,v0=signature"
 * Payload to sign: "{timestamp}.{rawBody}"
 *
 * @param rawBody - The raw request body as string (NOT parsed JSON)
 * @param signatureHeader - The "ElevenLabs-Signature" header value
 * @param secret - The webhook secret from environment variables
 * @returns Object with success status and optional error message
 */
export async function verifyElevenLabsSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string | undefined
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  // Check if signature header exists
  if (!signatureHeader) {
    return { success: false, error: "Missing signature header", status: 400 };
  }

  // Check if secret is configured
  if (!secret) {
    console.error("[ElevenLabs Webhook] ELEVENLABS_WEBHOOK_SECRET not configured");
    return { success: false, error: "Webhook authentication not configured", status: 401 };
  }

  // Parse signature header: "t=timestamp,v0=hash"
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v0="));

  if (!timestampPart || !signaturePart) {
    console.error("[ElevenLabs Webhook] Invalid signature header format");
    return { success: false, error: "Invalid signature format", status: 401 };
  }

  const timestamp = timestampPart.substring(2); // Remove "t="
  const receivedSignature = signaturePart; // Keep "v0=" prefix for comparison

  // Validate timestamp (reject requests older than 30 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  const requestTime = parseInt(timestamp, 10);
  const toleranceSeconds = 30 * 60; // 30 minutes

  if (isNaN(requestTime)) {
    console.error("[ElevenLabs Webhook] Invalid timestamp in header");
    return { success: false, error: "Invalid timestamp", status: 401 };
  }

  if (currentTime - requestTime > toleranceSeconds) {
    console.error("[ElevenLabs Webhook] Request timestamp expired");
    return { success: false, error: "Request expired", status: 401 };
  }

  // Compute HMAC-SHA256 signature using Web Crypto API
  const payloadToSign = `${timestamp}.${rawBody}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payloadToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

  // Convert to hex string with "v0=" prefix
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const expectedSignature = `v0=${hashHex}`;

  // Constant-time comparison to prevent timing attacks
  if (!timingSafeEqual(expectedSignature, receivedSignature)) {
    console.error("[ElevenLabs Webhook] Signature verification failed");
    return { success: false, error: "Invalid signature", status: 401 };
  }

  return { success: true };
}

// ============================================
// HTTP Response Helpers
// ============================================

export function jsonResponse(data: AgentResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, message }, status);
}

export function successResponse(message: string): Response {
  return jsonResponse({ success: true, message });
}

// ============================================
// Request Parsing & Validation
// ============================================

/**
 * Parses and validates a request body using a Zod schema
 * Returns either validated data or an error response
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; response: Response }
> {
  let body: unknown;

  // Parse JSON body
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: errorResponse("Invalid JSON body"),
    };
  }

  // Validate with Zod schema
  const result = schema.safeParse(body);

  if (!result.success) {
    // Log validation error for debugging
    console.error("[Validation Error]", {
      body,
      error: result.error.issues,
    });

    // Get first error message from Zod error
    const firstError = result.error.issues?.[0];
    const message = firstError?.message || "Datos de entrada inválidos";

    return {
      success: false,
      response: errorResponse(message),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
