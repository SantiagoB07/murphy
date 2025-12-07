import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const runtime = "edge";

const KAPSO_API_KEY = process.env.KAPSO_API_KEY;
const KAPSO_PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID;

// Función para enviar mensaje de WhatsApp via Kapso
async function sendWhatsAppMessage(to: string, body: string) {
  console.log("Sending message to:", to, "body:", body);
  
  const response = await fetch(
    `https://api.kapso.ai/meta/whatsapp/v24.0/${KAPSO_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        "X-API-Key": KAPSO_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "text",
        text: { body },
      }),
    }
  );

  const responseText = await response.text();
  console.log("Kapso response status:", response.status);
  console.log("Kapso response body:", responseText);
  
  try {
    return JSON.parse(responseText);
  } catch {
    return { error: responseText, status: response.status };
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Log para debugging
    console.log("WhatsApp webhook received:", JSON.stringify(payload, null, 2));

    // Kapso envía los datos en batch, extraer del array data[]
    const data = payload.batch ? payload.data?.[0] : payload;
    const message = data?.message;
    const conversation = data?.conversation;
    
    if (!message || !conversation) {
      console.log("No message or conversation in payload");
      return Response.json({ success: true, message: "No message to process" });
    }

    // El número viene en conversation.phone_number
    const from = conversation.phone_number;
    
    // El texto está en message.text.body o en message.kapso.content
    const text = message.text?.body || message.kapso?.content;
    
    // Solo procesar mensajes entrantes
    if (message.kapso?.direction !== "inbound") {
      console.log("Ignoring non-inbound message");
      return Response.json({ success: true, message: "Ignored outbound message" });
    }

    if (!from || !text) {
      console.log("Missing from or text in payload");
      return Response.json({ success: true, message: "No message to process" });
    }

    console.log(`Message from ${from}: ${text}`);

    // Generar respuesta con AI SDK
    const { text: aiResponse } = await generateText({
      model: openai('gpt-4o-mini'),
      system: 'Eres Murphy, un asistente amable para pacientes con diabetes. Responde de forma breve y concisa en español.',
      prompt: text,
    });

    await sendWhatsAppMessage(from, aiResponse);

    return Response.json({ 
      success: true,
      from,
      message_received: text,
      response_sent: aiResponse
    });

  } catch (error) {
    console.error("Webhook error:", error instanceof Error ? error.message : error);
    console.error("Stack:", error instanceof Error ? error.stack : "no stack");
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal error" 
    }, { status: 500 });
  }
}

// Kapso puede enviar GET para verificar el webhook
export async function GET() {
  return Response.json({ status: "ok", message: "Echo server is active" });
}
