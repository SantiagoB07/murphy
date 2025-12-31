import { internal } from "../_generated/api";
import { httpAction } from "../_generated/server";
import { whatsappMessageReceivedSchema } from "./schema";

async function verifyWebhook(payload: string, signature: string | null, secret: string | undefined): Promise<boolean> {
  if (!signature) {
    console.warn("No signature provided for webhook verification");
    return false;
  }
  if (!secret) {
    console.error("No secret provided for webhook verification");
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Use constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

const KAPSO_WEBHOOK_SECRET = process.env.KAPSO_WEBHOOK_SECRET;

export const httpKapsoWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-webhook-signature");
  const payload = await request.text();

  const isValid = await verifyWebhook(payload, signature, KAPSO_WEBHOOK_SECRET);

  if (!isValid) {
    console.error("[Kapso Webhook] Invalid webhook signature");
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(payload);
  const eventType = request.headers.get("x-webhook-event") || "unknown";

  switch (eventType) {
    case "whatsapp.message.received":
      const parsedData = whatsappMessageReceivedSchema.safeParse(body);
      if (parsedData.error) {
        return new Response("Invalid payload structure", { status: 400 });
      }

      await ctx.scheduler.runAfter(0, internal.kapso.agent.handleKapsoWhatsappMessage, {
        ...parsedData.data
      })
      return new Response("OK", { status: 200 });
    default:
      console.log("[Kapso Webhook] Unhandled event type:", eventType);
      return new Response("Event type not handled", { status: 400 });
  }
})
