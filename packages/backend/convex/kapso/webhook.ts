import z from "zod";
import { httpAction } from "../_generated/server";

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

  return signature === expectedSignature;
}

const KAPSO_WEBHOOK_SECRET = process.env.KAPSO_WEBHOOK_SECRET


/* 
Explample payload for "whatsapp.message.received" event:

{
message: {
    id: 'wamid.TEST_yHAWOMudsRSLBJZ27v9nFVTLQWhhTw',
    timestamp: '1767111113',
    type: 'text',
    text: {
      body: 'This is a test message from Kapso webhook testing'
    },
    from: '+573027842717',
    kapso: {
      direction: 'inbound',
      status: 'received',
      processing_status: 'pending',
      origin: 'cloud_api',
      has_media: false
    }
  },
  conversation: {
    id: 'test-conv-4dd8a015af577a89',
    phone_number: '+57 302 7842717',
    status: 'active',
    last_active_at: '2025-12-30T13:11:53-03:00',
    created_at: '2025-12-30T12:11:53-03:00',
    updated_at: '2025-12-30T13:11:53-03:00',
    metadata: {},
    phone_number_id: '825266384004171',
    kapso: {
      messages_count: 0
    }
  },
  is_new_conversation: false,
  phone_number_id: '825266384004171',
  test: true,
  test_timestamp: '2025-12-30T13:11:53-03:00'
} */

const whatsappMessageReceivedSchema = z.object({
  message: z.object({
    id: z.string(),
    timestamp: z.string(),
    type: z.string(),
    text: z.object({
      body: z.string()
    }).optional(),
    from: z.string(),
    kapso: z.object({
      direction: z.string(),
      status: z.string(),
      processing_status: z.string(),
      origin: z.string(),
      has_media: z.boolean()
    })
  }),
  conversation: z.object({
    id: z.string(),
    phone_number: z.string(),
    status: z.string(),
    last_active_at: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    metadata: z.any(),
    phone_number_id: z.string(),
    kapso: z.object({
      messages_count: z.number()
    })
  }),
  is_new_conversation: z.boolean(),
  phone_number_id: z.string(),
  test: z.boolean().optional(),
  test_timestamp: z.string().optional()
})


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

      console.log("[Kapso Webhook] Received WhatsApp message:", parsedData.data);
      return new Response("OK", { status: 200 });
    default:
      console.log("[Kapso Webhook] Unhandled event type:", eventType);
      return new Response("Event type not handled", { status: 400 });
  }
})
