import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { InitiateCallResult } from "./types";

/**
 * Executes a scheduled alert based on the channel type.
 * Handles both call and whatsapp channels, and triggers reschedule/cleanup after execution.
 */
export const executeScheduledAlert = internalAction({
  args: {
    scheduleId: v.id("aiCallSchedules"),
  },
  handler: async (ctx, args) => {
    // 1. Get the schedule record
    const schedule = await ctx.runQuery(
      internal.aiCallSchedules.getByIdInternal,
      { id: args.scheduleId }
    );

    if (!schedule) {
      console.log(`[executeScheduledAlert] Schedule ${args.scheduleId} not found, skipping`);
      return;
    }

    if (!schedule.isActive) {
      console.log(`[executeScheduledAlert] Schedule ${args.scheduleId} is inactive, skipping`);
      return;
    }

    // 2. Execute based on channel
    if (schedule.channel === "call") {
      console.log(`[executeScheduledAlert] Initiating call for schedule ${args.scheduleId}`);
      await ctx.runAction(internal.agent.actions.initiateCall, {
        patientId: schedule.patientId,
        alertType: schedule.type,
        scheduleId: args.scheduleId,
      });
    } else if (schedule.channel === "whatsapp") {
      console.log(`[executeScheduledAlert] Initiating WhatsApp alert for schedule ${args.scheduleId}`);
      await ctx.runAction(internal.agent.actions.initiateWhatsappAlert, {
        patientId: schedule.patientId,
        alertType: schedule.type,
      });
    }

    // 3. Handle reschedule or cleanup
    await ctx.runMutation(internal.aiCallSchedules.rescheduleOrCleanup, {
      scheduleId: args.scheduleId,
    });
  },
});

/**
 * Initiates an outbound call to a patient via ElevenLabs
 * Can be triggered from the Convex dashboard or scheduled
 */
export const initiateCall = internalAction({
  args: {
    patientId: v.id("patientProfiles"),
    toNumber: v.optional(v.string()), // Override phone number
    isReminder: v.optional(v.boolean()),
    alertType: v.optional(v.string()),
    scheduleId: v.optional(v.id("aiCallSchedules")), // If triggered by a schedule
    retryCount: v.optional(v.number()), // For retry tracking
  },
  handler: async (ctx, args): Promise<InitiateCallResult> => {
    // 1. Get patient context
    const patientContext = await ctx.runQuery(
      internal.agent.queries.getPatientContextById,
      { patientId: args.patientId }
    );

    if (!patientContext) {
      throw new Error(`Patient not found: ${args.patientId}`);
    }

    // 2. Determine phone number
    const phoneNumber: string | undefined = args.toNumber || patientContext.phoneNumber;
    if (!phoneNumber) {
      throw new Error(
        `No phone number available for patient: ${patientContext.name}`
      );
    }

    // 3. Get insulin schedules and day status
    const [rapidStatus, basalStatus] = await Promise.all([
      ctx.runQuery(internal.agent.queries.getInsulinDayStatus, {
        patientId: args.patientId,
        insulinType: "rapid",
      }),
      ctx.runQuery(internal.agent.queries.getInsulinDayStatus, {
        patientId: args.patientId,
        insulinType: "basal",
      }),
    ]);

    // 4. Build dynamic variables for ElevenLabs
    const dynamicVariables = {
      patient_id: args.patientId,
      patient_name: patientContext.name,
      patient_age: patientContext.age,
      diabetes_type: patientContext.diabetesType,
      diagnosis_year: patientContext.diagnosisYear,
      recent_glucometries: patientContext.recentGlucometries,
      recent_sleep: patientContext.recentSleep,
      recent_insulin: patientContext.recentInsulin,
      insulin_rapid_schedule: rapidStatus.scheduleText,
      insulin_basal_schedule: basalStatus.scheduleText,
      is_reminder: String(args.isReminder ?? false),
      alert_type: args.alertType ?? "",
    };

    // 5. Validate environment variables
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY environment variable not set");
    }
    if (!agentId) {
      throw new Error("ELEVENLABS_AGENT_ID environment variable not set");
    }
    if (!phoneNumberId) {
      throw new Error("ELEVENLABS_PHONE_NUMBER_ID environment variable not set");
    }

    // 6. Call ElevenLabs API
    console.log(`[initiateCall] Calling ${phoneNumber} for patient ${patientContext.name}`);
    console.log("[initiateCall] Dynamic variables:", JSON.stringify(dynamicVariables));

    const response: Response = await fetch(
      "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
          agent_phone_number_id: phoneNumberId,
          to_number: phoneNumber,
          conversation_initiation_client_data: {
            dynamic_variables: dynamicVariables,
          },
        }),
      }
    );

    const data: { call_id?: string; id?: string; conversation_id?: string } = await response.json();

    if (!response.ok) {
      console.error("[initiateCall] ElevenLabs API error:", data);
      throw new Error(`Failed to initiate call: ${JSON.stringify(data)}`);
    }

    const conversationId = data.conversation_id || data.call_id || data.id || "";

    // 7. Create call record for retry tracking
    await ctx.runMutation(internal.callRecords.create, {
      patientId: args.patientId,
      scheduleId: args.scheduleId,
      conversationId,
      alertType: args.alertType,
      retryCount: args.retryCount ?? 0,
    });

    console.log("[initiateCall] Call initiated and record created:", conversationId);

    return {
      success: true,
      callId: conversationId,
      phoneNumber,
      patientName: patientContext.name,
    };
  },
});

/**
 * Retries a failed call based on an existing call record
 * Called by scheduled functions when a call fails or is too short
 */
export const retryCall = internalAction({
  args: {
    callRecordId: v.id("callRecords"),
  },
  handler: async (ctx, args) => {
    // 1. Get the original call record
    const originalRecord = await ctx.runQuery(
      internal.callRecords.getById,
      { id: args.callRecordId }
    );

    if (!originalRecord) {
      console.log(`[retryCall] Record ${args.callRecordId} not found`);
      return;
    }

    const newRetryCount = originalRecord.retryCount + 1;
    console.log(`[retryCall] Retrying call for patient ${originalRecord.patientId} (attempt ${newRetryCount})`);

    // 2. Initiate new call with incremented retry count
    await ctx.runAction(internal.agent.actions.initiateCall, {
      patientId: originalRecord.patientId,
      scheduleId: originalRecord.scheduleId,
      alertType: originalRecord.alertType,
      retryCount: newRetryCount,
    });
  },
});

// ============================================
// WhatsApp Alert Messages
// ============================================

const WHATSAPP_ALERT_MESSAGES: Record<string, (name: string) => string> = {
  glucometry: (name) => `¡Hola ${name}! Es hora de medir tu glucosa. ¿Cuánto te dio?`,
  insulin: (name) => `¡Hola ${name}! Es hora de tu insulina. ¿Ya te la aplicaste?`,
  wellness: (name) => `¡Hola ${name}! ¿Cómo te sientes hoy? ¿Dormiste bien anoche?`,
  general: (name) => `¡Hola ${name}! Soy Murphy. ¿Cómo estás hoy?`,
};

/**
 * Initiates an outbound WhatsApp message to a patient via Kapso
 * Sends a template message based on the alert type
 */
export const initiateWhatsappAlert = internalAction({
  args: {
    patientId: v.id("patientProfiles"),
    alertType: v.optional(v.string()),
    toNumber: v.optional(v.string()), // Override phone number
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    phoneNumber: string;
    patientName: string;
    alertType: string;
  }> => {
    // 1. Get patient context
    const patientContext = await ctx.runQuery(
      internal.agent.queries.getPatientContextById,
      { patientId: args.patientId }
    );

    if (!patientContext) {
      throw new Error(`Patient not found: ${args.patientId}`);
    }

    // 2. Determine phone number
    const phoneNumber: string | undefined = args.toNumber || patientContext.phoneNumber;
    if (!phoneNumber) {
      throw new Error(
        `No phone number available for patient: ${patientContext.name}`
      );
    }

    // 3. Generate message based on alert type
    const alertType = args.alertType || "general";
    const messageGenerator = WHATSAPP_ALERT_MESSAGES[alertType] || WHATSAPP_ALERT_MESSAGES.general;
    const message = messageGenerator(patientContext.name);

    // 4. Send WhatsApp message
    console.log(`[initiateWhatsappAlert] Sending to ${phoneNumber}: "${message}"`);
    
    await ctx.runAction(internal.kapso.lib.sendWhatsappMessage, {
      to: phoneNumber,
      body: message,
    });

    console.log(`[initiateWhatsappAlert] Message sent successfully to ${patientContext.name}`);

    return {
      success: true,
      phoneNumber,
      patientName: patientContext.name,
      alertType,
    };
  },
});
