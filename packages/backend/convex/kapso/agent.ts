import { z } from "zod";
import { internalAction } from "../_generated/server";
import { components, internal } from "../_generated/api";
import { whatsappMessageReceivedSchema } from "./schema";
import { Agent, createThread, stepCountIs } from "@convex-dev/agent";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { kapsoTools } from "./tools";
import type { KapsoToolCtx } from "./tools";
import type { Id } from "../_generated/dataModel";

type WhatsappMessageReceivedSchema = z.infer<typeof whatsappMessageReceivedSchema>;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
});

const model = google("gemini-3-flash-preview");

/**
 * System prompt for Murphy WhatsApp agent.
 * @see prompts/murphyWhatsapp.md for the canonical version of this prompt.
 * Keep both files in sync when making changes.
 */
const MURPHY_INSTRUCTIONS = `You are Murphy, a friendly health assistant for people with diabetes who communicates via WhatsApp.

## Your Personality
- Kind, empathetic, and professional
- Brief and clear responses (it's WhatsApp, not an essay)
- Use emojis occasionally to be friendly, but don't overdo it
- Speak in casual but respectful English

## Context
You already have access to the patient's history and profile. Use it to personalize your responses.
- Greet the patient by name
- If there are recent records, briefly comment on how their metrics are going
- Ask how they're feeling today

## Available Tools
You have access to tools for saving and correcting records:

### Save new records:
1. **saveGlucose** - When the patient tells you their glucose level
2. **saveInsulin** - When the patient tells you they took insulin
   IMPORTANT: Always ask WHAT TYPE of insulin (rapid or basal) if they don't mention it
3. **saveSleep** - When the patient tells you how many hours they slept
4. **saveStress** - When the patient mentions stress or anxiety
5. **saveDizziness** - When the patient mentions dizziness

### Correct last record:
- **updateGlucose**, **updateInsulin**, **updateSleep**, **updateStress**, **updateDizziness**

## Unusual Value Verification
BEFORE saving, confirm if the value seems unusual:

- **Glucose**: If it's below 70 or above 300 mg/dL:
  "Are you sure your glucose is [value]? That's a bit unusual."

- **Sleep**: If it's less than 3 or more than 12 hours:
  "Did you only sleep [value] hours? Just want to make sure I record it correctly."

- **Insulin**: 
  - If they don't specify the type, ALWAYS ask: "Was it rapid or basal insulin?"
  - If it's more than 50 units: "Did you take [value] units? Just want to confirm."

If the value is within normal ranges, record it directly without asking.

## Handling Stress, Anxiety, and Dizziness
When the patient mentions stress, anxiety, or dizziness:
1. Briefly ask for context: "What do you think caused it?"
2. Listen to their response with empathy, without judgment
3. Then save the record

## Important
- NEVER give specific medical advice
- If the patient reports an emergency (very low glucose, severe dizziness), recommend seeking immediate medical attention
- If you don't understand something, ask them to repeat it
- Be brief: maximum 2-3 sentences per message
`;

// ============================================
// Agente de WhatsApp (Kapso)
// ============================================

export const murphyAgent = new Agent(components.agent, {
  name: "Murphy",
  instructions: MURPHY_INSTRUCTIONS,
  languageModel: model,
  tools: kapsoTools,
  stopWhen: stepCountIs(5),
});

// ============================================
// Handler Principal de Mensajes
// ============================================

export const handleKapsoWhatsappMessage = internalAction({
  handler: async (ctx, args: WhatsappMessageReceivedSchema) => {
    // Normalizar número de teléfono a formato E.164 (con +)
    const rawPhone = args.message.from;
    const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;

    const kapsoConversationId = args.conversation.id;
    const messageText = args.message.text?.body || "";

    // 1. Buscar si el paciente existe
    const patient = await ctx.runQuery(
      internal.kapso.queries.getPatientFromPhoneNumber,
      { phoneNumber }
    );

    // 2. Si no está registrado, responder amablemente y salir
    if (!patient) {
      await ctx.runAction(internal.kapso.lib.sendWhatsappMessage, {
        to: phoneNumber,
        body: "Hi there! I'm Murphy, your diabetes health assistant. 👋\n\nTo help you, you first need to sign up in our app. Once registered with this phone number, you can use WhatsApp to log your glucose and more.\n\nDo you have any questions about how to sign up?",
      });
      return;
    }

    // 3. Obtener contexto completo del paciente (igual que ElevenLabs)
    const patientContext = await ctx.runQuery(
      internal.agent.queries.getPatientContextById,
      { patientId: patient._id }
    );

    // 4. Obtener estado de insulina del día
    const [rapidStatus, basalStatus] = await Promise.all([
      ctx.runQuery(internal.agent.queries.getInsulinDayStatus, {
        patientId: patient._id,
        insulinType: "rapid",
      }),
      ctx.runQuery(internal.agent.queries.getInsulinDayStatus, {
        patientId: patient._id,
        insulinType: "basal",
      }),
    ]);

    // 5. Obtener o crear conversación persistente
    let conversation = await ctx.runQuery(
      internal.kapso.conversations.getConversationByPhone,
      { phoneNumber }
    );

    let threadId: string;

    if (!conversation) {
      // Crear nuevo thread y guardarlo
      threadId = await createThread(ctx, components.agent);
      await ctx.runMutation(internal.kapso.conversations.createConversation, {
        phoneNumber,
        kapsoConversationId,
        convexThreadId: threadId,
        patientId: patient._id,
      });
    } else {
      // Usar thread existente
      threadId = conversation.convexThreadId;

      // Actualizar timestamp
      await ctx.runMutation(
        internal.kapso.conversations.updateConversationTimestamp,
        { phoneNumber }
      );

      // Si no tenía patientId, vincularlo ahora
      if (!conversation.patientId) {
        await ctx.runMutation(
          internal.kapso.conversations.linkPatientToConversation,
          { phoneNumber, patientId: patient._id }
        );
      }
    }

    // 6. Crear contexto personalizado con patientId para los tools
    const toolContext: KapsoToolCtx = {
      ...ctx,
      patientId: patient._id as Id<"patientProfiles">,
    } as KapsoToolCtx;

    // 7. Generar respuesta con el agente, inyectando contexto del paciente
    const result = await murphyAgent.generateText(
      toolContext,
      { threadId },
      { prompt: messageText },
      {

        contextOptions: {
          recentMessages: 15,
          searchOptions: {
            limit: 5,
            textSearch: true,
            messageRange: {
              before: 2,
              after: 1
            }
          }
        },

        contextHandler: async (_handlerCtx, handlerArgs) => {
          // Construir mensaje de contexto igual que ElevenLabs
          const contextMessage = {
            role: "system" as const,
            content: `## Paciente
- Nombre: ${patientContext?.name || "Paciente"}
- Edad: ${patientContext?.age || "desconocida"} años
- Tipo de diabetes: ${patientContext?.diabetesType || "no especificado"}
- Diagnosticado en: ${patientContext?.diagnosisYear || "no especificado"}

## Configuración de Insulina
Insulina Rápida: ${rapidStatus.scheduleText}
Insulina Basal: ${basalStatus.scheduleText}

## Historial reciente
Glucometrías (últimas 10): ${patientContext?.recentGlucometries || "Sin registros"}
Horas de sueño (últimas 10): ${patientContext?.recentSleep || "Sin registros"}
Dosis de insulina (últimas 10): ${patientContext?.recentInsulin || "Sin registros"}`,
          };

          // Inyectar contexto al inicio de los mensajes
          return [contextMessage, ...handlerArgs.allMessages];
        },
      }
    );

    // 8. Enviar respuesta por WhatsApp
    const responseText =
      result.text || "Sorry, I had a problem processing your message. Can you try again?";

    await ctx.runAction(internal.kapso.lib.sendWhatsappMessage, {
      to: phoneNumber,
      body: responseText,
    });
  },
});
