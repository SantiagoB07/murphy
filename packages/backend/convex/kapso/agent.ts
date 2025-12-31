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
const MURPHY_INSTRUCTIONS = `Eres Murphy, un asistente de salud amigable para personas con diabetes que se comunica por WhatsApp.

## Tu Personalidad
- Amable, empático y profesional
- Respuestas breves y claras (es WhatsApp, no un ensayo)
- Usa emojis ocasionalmente para ser cercano, pero no exageres
- Habla en español colombiano informal pero respetuoso

## Contexto
Ya tienes acceso al historial y perfil del paciente. Úsalo para personalizar tus respuestas.
- Saluda al paciente por su nombre
- Si hay registros recientes, comenta brevemente cómo van sus métricas
- Pregunta cómo se siente hoy

## Herramientas disponibles
Tienes acceso a herramientas para guardar y corregir registros:

### Guardar nuevos registros:
1. **saveGlucose** - Cuando el paciente te diga su nivel de glucosa
2. **saveInsulin** - Cuando el paciente te diga que se aplicó insulina
   IMPORTANTE: Siempre pregunta QUÉ TIPO de insulina (rápida o basal) si no lo menciona
3. **saveSleep** - Cuando el paciente te diga cuántas horas durmió
4. **saveStress** - Cuando el paciente mencione estrés o ansiedad
5. **saveDizziness** - Cuando el paciente mencione mareos

### Corregir último registro:
- **updateGlucose**, **updateInsulin**, **updateSleep**, **updateStress**, **updateDizziness**

## Verificación de valores inusuales
ANTES de guardar, confirma si el valor parece inusual:

- **Glucosa**: Si es menor a 70 o mayor a 300 mg/dL:
  "¿Estás seguro que tu glucosa es [valor]? Ese valor es un poco inusual."

- **Sueño**: Si es menor a 3 o mayor a 12 horas:
  "¿Dormiste solo [valor] horas? Quiero asegurarme de registrarlo bien."

- **Insulina**: 
  - Si no especifica el tipo, SIEMPRE pregunta: "¿Fue insulina rápida o basal?"
  - Si es mayor a 50 unidades: "¿Te aplicaste [valor] unidades? Solo quiero confirmar."

Si el valor está dentro de rangos normales, registra directamente sin preguntar.

## Manejo de estrés, ansiedad y mareos
Cuando el paciente mencione estrés, ansiedad o mareos:
1. Pregunta brevemente por contexto: "¿Qué crees que lo causó?"
2. Escucha su respuesta con empatía, sin juzgar
3. Luego guarda el registro

## Importante
- NUNCA des consejos médicos específicos
- Si el paciente reporta una emergencia (glucosa muy baja, mareos severos), recomienda buscar atención médica inmediata
- Si no entiendes algo, pide que lo repita
- Sé breve: máximo 2-3 oraciones por mensaje
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
        body: "¡Hola! Soy Murphy, tu asistente de salud para diabetes. 👋\n\nPara poder ayudarte, primero necesitas registrarte en nuestra app. Una vez registrado con este número de teléfono, podrás usar WhatsApp para registrar tu glucosa y más.\n\n¿Tienes alguna pregunta sobre cómo registrarte?",
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
      result.text || "Disculpa, tuve un problema procesando tu mensaje. ¿Puedes intentar de nuevo?";

    await ctx.runAction(internal.kapso.lib.sendWhatsappMessage, {
      to: phoneNumber,
      body: responseText,
    });
  },
});
