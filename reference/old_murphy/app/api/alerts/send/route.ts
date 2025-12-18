import { NextRequest, NextResponse } from "next/server";
import { getPatientById, getPatientContext } from "@/app/lib/services/patient";

// WhatsApp (Kapso)
const KAPSO_API_KEY = process.env.KAPSO_API_KEY;
const KAPSO_PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID;

// ElevenLabs (Llamadas)
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const ELEVENLABS_PHONE_NUMBER_ID = process.env.ELEVENLABS_PHONE_NUMBER_ID;

// Auth
const ALERTS_SECRET_KEY = process.env.ALERTS_SECRET_KEY;

// Mensajes para WhatsApp
const WHATSAPP_MESSAGES: Record<string, (name: string) => string> = {
  glucometry: (name: string) => `Hola ${name}, ¿ya mediste tu glucosa?`,
  insulin: (name: string) => `Hola ${name}, recuerda aplicar tu insulina`,
};

// Mensajes para llamadas (first_message del agente)
const CALL_MESSAGES: Record<string, (name: string) => string> = {
  glucometry: (name: string) => `Hola ${name}, te llamo porque es hora de registrar tu glucosa.`,
  insulin: (name: string) => `Hola ${name}, te llamo porque es hora de aplicar tu insulina.`,
};

async function sendWhatsAppMessage(to: string, body: string) {
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
  return response.json();
}

async function makePhoneCall(
  to: string, 
  dynamicVariables: Record<string, string>,
  firstMessage: string
) {
  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: ELEVENLABS_AGENT_ID,
        agent_phone_number_id: ELEVENLABS_PHONE_NUMBER_ID,
        to_number: to,
        first_message: firstMessage,
        conversation_initiation_client_data: {
          dynamic_variables: dynamicVariables,
        },
      }),
    }
  );
  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    // Validar Authorization header
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${ALERTS_SECRET_KEY}`) {
      console.log("[ALERT] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      alert_id, 
      patient_id, 
      patient_phone, 
      patient_name, 
      alert_type,
      channel = 'whatsapp'  // Default a whatsapp si no viene
    } = body;

    console.log(`[ALERT] Processing: ${alert_type} for ${patient_name} (${patient_phone}) via ${channel}`);

    if (channel === 'call') {
      // ========== LLAMADA via ElevenLabs ==========
      const messageGenerator = CALL_MESSAGES[alert_type];
      if (!messageGenerator) {
        console.log(`[ALERT] Unknown alert_type: ${alert_type}`);
        return NextResponse.json({ error: "Unknown alert_type" }, { status: 400 });
      }

      // Obtener contexto completo del paciente
      const patient = await getPatientById(patient_id);
      if (!patient) {
        console.log(`[ALERT] Patient not found: ${patient_id}`);
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      const context = await getPatientContext(patient);

      // Preparar variables dinámicas para ElevenLabs
      const dynamicVariables = {
        patient_id: patient_id,
        patient_name: context.name,
        patient_age: context.age,
        diabetes_type: context.diabetesType,
        diagnosis_year: context.diagnosisYear,
        recent_glucometries: context.recentGlucometries,
        recent_sleep: context.recentSleep,
        recent_insulin: context.recentInsulin,
        is_reminder: "true",
        alert_type: alert_type,
      };

      const firstMessage = messageGenerator(patient_name);
      const result = await makePhoneCall(patient_phone, dynamicVariables, firstMessage);

      console.log(`[ALERT] Call initiated to ${patient_phone}:`, result);

      return NextResponse.json({ 
        success: true, 
        alert_id,
        patient_id,
        channel: 'call',
        first_message: firstMessage,
        elevenlabs_response: result
      });

    } else {
      // ========== WHATSAPP via Kapso ==========
      const messageGenerator = WHATSAPP_MESSAGES[alert_type];
      if (!messageGenerator) {
        console.log(`[ALERT] Unknown alert_type: ${alert_type}`);
        return NextResponse.json({ error: "Unknown alert_type" }, { status: 400 });
      }

      const message = messageGenerator(patient_name);
      const result = await sendWhatsAppMessage(patient_phone, message);

      console.log(`[ALERT] WhatsApp sent to ${patient_phone}:`, result);

      return NextResponse.json({ 
        success: true, 
        alert_id,
        patient_id,
        channel: 'whatsapp',
        message_sent: message,
        kapso_response: result
      });
    }

  } catch (error) {
    console.error("[ALERT] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
