import { generateText, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createMurphyTools } from '@/app/lib/tools'
import { getPatientByPhone, getPatientContext, PatientContext } from '@/app/lib/services/patient'
import { saveMessage, getMessageHistory } from '@/app/lib/services/messages'

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

const BASE_SYSTEM_PROMPT = `Eres Murphy, un asistente amable para pacientes con diabetes.

Tienes las siguientes herramientas disponibles:
- save_glucometry: Para registrar niveles de glucosa/azúcar
- update_glucometry: Para corregir el último registro de glucosa
- save_insulin: Para registrar dosis de insulina
- update_insulin: Para corregir la última dosis de insulina
- save_sleep: Para registrar horas de sueño
- update_sleep: Para corregir las horas de sueño
- save_symptom: Para registrar síntomas (estrés/ansiedad o mareos)
- update_symptom: Para corregir un síntoma registrado

Instrucciones:
- Cuando el usuario mencione datos de salud, usa la herramienta correspondiente para registrarlos
- Responde de forma breve y concisa en español
- Sé amable y motivador
- Si el usuario quiere corregir algo, usa las herramientas de update
- Usa la información del paciente de la base de datos para personalizar tus respuestas`;

function buildSystemPrompt(context: PatientContext): string {
  return `${BASE_SYSTEM_PROMPT}

=== INFORMACIÓN DEL PACIENTE (Base de datos) ===
Nombre: ${context.name}
Edad: ${context.age}
Tipo de diabetes: ${context.diabetesType}
Año de diagnóstico: ${context.diagnosisYear}

=== REGISTROS RECIENTES ===
Glucometrías: ${context.recentGlucometries}
Horas de sueño: ${context.recentSleep}
Dosis de insulina: ${context.recentInsulin}`;
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

    // 1. Buscar paciente por teléfono
    const patient = await getPatientByPhone(from);

    if (!patient) {
      console.log(`Patient not found for phone: ${from}`);
      await sendWhatsAppMessage(from, "No te reconozco. Contacta a tu médico para registrarte.");
      return Response.json({ success: true, message: "Unknown patient" });
    }

    console.log(`Patient found: ${patient.name} (${patient.id})`);

    // 2. Obtener contexto del paciente (info + métricas recientes)
    const context = await getPatientContext(patient);
    console.log(`Patient context loaded`);

    // 3. Obtener historial de mensajes (últimos 10)
    const history = await getMessageHistory(patient.id, 10);
    console.log(`Message history: ${history.length} messages`);

    // Convertir historial a formato de mensajes para AI SDK
    const previousMessages = history.flatMap(msg => [
      { role: 'user' as const, content: msg.user_message },
      { role: 'assistant' as const, content: msg.bot_response },
    ]);

    // 4. Crear tools para el paciente
    const tools = createMurphyTools(patient.id);

    // 5. Generar respuesta con AI SDK + Tools
    const { text: aiResponse, steps } = await generateText({
      model: openai('gpt-4o-mini'),
      system: buildSystemPrompt(context),
      tools,
      stopWhen: stepCountIs(3),
      messages: [
        ...previousMessages,
        { role: 'user', content: text },
      ],
    });

    // 6. Extraer tool calls de los steps
    const toolCalls = steps.flatMap(step => 
      (step.toolCalls || []).map(tc => ({
        toolName: tc.toolName,
        args: tc.input as Record<string, unknown>,
      }))
    );

    console.log(`AI Response: ${aiResponse}`);
    if (toolCalls.length > 0) {
      console.log(`Tool calls: ${JSON.stringify(toolCalls)}`);
    }

    // 7. Guardar mensaje en la base de datos
    await saveMessage({
      patientId: patient.id,
      userMessage: text,
      botResponse: aiResponse,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      source: 'whatsapp',
    });

    // 8. Enviar respuesta
    await sendWhatsAppMessage(from, aiResponse);

    return Response.json({ 
      success: true,
      from,
      patient: patient.name,
      message_received: text,
      response_sent: aiResponse,
      tool_calls: toolCalls,
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
  return Response.json({ status: "ok", message: "Murphy WhatsApp bot is active" });
}
