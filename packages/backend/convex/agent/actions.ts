import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { InitiateCallResult } from "./types";

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

    const data: { call_id?: string; id?: string } = await response.json();

    if (!response.ok) {
      console.error("[initiateCall] ElevenLabs API error:", data);
      throw new Error(`Failed to initiate call: ${JSON.stringify(data)}`);
    }

    console.log("[initiateCall] Call initiated successfully:", data);

    return {
      success: true,
      callId: data.call_id || data.id || "",
      phoneNumber,
      patientName: patientContext.name,
    };
  },
});
