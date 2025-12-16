import { v } from "convex/values";
import { internalMutation, internalQuery, internalAction } from "./_generated/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============================================
// Types
// ============================================

type AgentResponse = {
  success: boolean;
  message: string;
};

type RequestBody = {
  patient_id?: string;
  value?: number;
  dose?: number;
  insulin_type?: "rapid" | "basal";
  hours?: number;
  quality?: number;
  level?: number;
  severity?: number;
  symptoms?: string[];
  duration_minutes?: number;
  notes?: string;
  // Nested formats that ElevenLabs might send
  glucometry_data?: { patient_id?: string; value?: number };
  insulin_data?: { patient_id?: string; dose?: number; insulin_type?: "rapid" | "basal" };
  sleep_data?: { patient_id?: string; hours?: number; quality?: number };
  stress_data?: { patient_id?: string; level?: number; notes?: string };
  dizziness_data?: {
    patient_id?: string;
    severity?: number;
    symptoms?: string[];
    duration_minutes?: number;
    notes?: string;
  };
};

const insulinTypes = v.union(v.literal("rapid"), v.literal("basal"));

// ============================================
// Internal Queries (for finding records)
// ============================================

export const getPatientById = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.patientId);
  },
});

export const getLatestGlucoseRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("glucoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .first();
  },
});

export const getLatestInsulinRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("insulinDoseRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .first();
  },
});

export const getLatestSleepRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sleepRecords")
      .withIndex("by_patient_date", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .first();
  },
});

export const getLatestStressRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("stressRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .first();
  },
});

export const getLatestDizzinessRecord = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dizzinessRecords")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .first();
  },
});

/**
 * Gets patient context for AI agent calls (internal, no auth required)
 * Returns summary data formatted for ElevenLabs dynamic variables
 */
export const getPatientContextById = internalQuery({
  args: { patientId: v.id("patientProfiles") },
  handler: async (ctx, args) => {
    const profile = await ctx.db.get(args.patientId);

    if (!profile) {
      return null;
    }

    // Get last 10 records of each type
    const limit = 10;
    const [recentGlucose, recentSleep, recentInsulinDoses] = await Promise.all([
      ctx.db
        .query("glucoseRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", args.patientId))
        .order("desc")
        .take(limit),
      ctx.db
        .query("sleepRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", args.patientId))
        .order("desc")
        .take(limit),
      ctx.db
        .query("insulinDoseRecords")
        .withIndex("by_patient_date", (q) => q.eq("patientId", args.patientId))
        .order("desc")
        .take(limit),
    ]);

    // Format relative time helper
    const formatRelativeTime = (timestamp: number): string => {
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) {
        return `hace ${diffMins} min`;
      } else if (diffHours < 24) {
        return `hace ${diffHours}h`;
      } else if (diffDays === 1) {
        return "ayer";
      } else if (diffDays < 7) {
        return `hace ${diffDays} días`;
      } else {
        const date = new Date(timestamp);
        return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
      }
    };

    // Format glucose readings
    const formattedGlucose =
      recentGlucose.length > 0
        ? recentGlucose
            .map((g) => `${g.value} mg/dL (${formatRelativeTime(g.recordedAt)})`)
            .join(", ")
        : "Sin registros";

    // Format sleep logs
    const formattedSleep =
      recentSleep.length > 0
        ? recentSleep
            .map((s) => `${s.hours} horas (${s.date})`)
            .join(", ")
        : "Sin registros";

    // Format insulin doses
    const formattedInsulin =
      recentInsulinDoses.length > 0
        ? recentInsulinDoses
            .map((i) => `${i.dose} unidades ${i.insulinType} (${formatRelativeTime(i.administeredAt)})`)
            .join(", ")
        : "Sin registros";

    return {
      patientId: args.patientId,
      name: profile.fullName || "Paciente",
      age: profile.age ? `${profile.age}` : "desconocida",
      diabetesType: profile.diabetesType || "no especificado",
      diagnosisYear: profile.diagnosisYear ? `${profile.diagnosisYear}` : "no especificado",
      phoneNumber: profile.phoneNumber,
      recentGlucometries: formattedGlucose,
      recentSleep: formattedSleep,
      recentInsulin: formattedInsulin,
    };
  },
});

// ============================================
// Internal Actions (for initiating calls)
// ============================================

type InitiateCallResult = {
  success: boolean;
  callId: string;
  phoneNumber: string;
  patientName: string;
};

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
      internal.agentTools.getPatientContextById,
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

    // 3. Build dynamic variables for ElevenLabs
    const dynamicVariables = {
      patient_id: args.patientId,
      patient_name: patientContext.name,
      patient_age: patientContext.age,
      diabetes_type: patientContext.diabetesType,
      diagnosis_year: patientContext.diagnosisYear,
      recent_glucometries: patientContext.recentGlucometries,
      recent_sleep: patientContext.recentSleep,
      recent_insulin: patientContext.recentInsulin,
      is_reminder: String(args.isReminder ?? false),
      alert_type: args.alertType ?? "",
    };

    // 4. Validate environment variables
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

    // 5. Call ElevenLabs API
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

// ============================================
// Internal Mutations (no auth required)
// ============================================

export const saveGlucoseRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    value: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const date = new Date(now).toISOString().split("T")[0];

    await ctx.db.insert("glucoseRecords", {
      patientId: args.patientId,
      value: args.value,
      date,
      recordedAt: now,
      notes: args.notes,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const updateGlucoseRecord = internalMutation({
  args: {
    recordId: v.id("glucoseRecords"),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      value: args.value,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const saveInsulinRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    dose: v.number(),
    insulinType: insulinTypes,
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const scheduledTime = new Date(now).toTimeString().split(" ")[0].slice(0, 5);

    await ctx.db.insert("insulinDoseRecords", {
      patientId: args.patientId,
      dose: args.dose,
      insulinType: args.insulinType,
      scheduledTime,
      administeredAt: now,
      notes: args.notes,
    });

    return { success: true };
  },
});

export const updateInsulinRecord = internalMutation({
  args: {
    recordId: v.id("insulinDoseRecords"),
    dose: v.number(),
    insulinType: insulinTypes,
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      dose: args.dose,
      insulinType: args.insulinType,
    });

    return { success: true };
  },
});

export const saveSleepRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    hours: v.number(),
    quality: v.number(),
  },
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split("T")[0];

    // Check if a record already exists for today - if so, update it
    const existing = await ctx.db
      .query("sleepRecords")
      .withIndex("by_patient_date", (q) =>
        q.eq("patientId", args.patientId).eq("date", date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        hours: args.hours,
        quality: args.quality,
      });
    } else {
      await ctx.db.insert("sleepRecords", {
        patientId: args.patientId,
        hours: args.hours,
        quality: args.quality,
        date,
      });
    }

    return { success: true };
  },
});

export const updateSleepRecord = internalMutation({
  args: {
    recordId: v.id("sleepRecords"),
    hours: v.number(),
    quality: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      hours: args.hours,
      quality: args.quality,
    });

    return { success: true };
  },
});

export const saveStressRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    level: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("stressRecords", {
      patientId: args.patientId,
      level: args.level,
      notes: args.notes,
      recordedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateStressRecord = internalMutation({
  args: {
    recordId: v.id("stressRecords"),
    level: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recordId, {
      level: args.level,
      notes: args.notes,
    });

    return { success: true };
  },
});

export const saveDizzinessRecord = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    severity: v.number(),
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("dizzinessRecords", {
      patientId: args.patientId,
      severity: args.severity,
      symptoms: args.symptoms ?? [],
      durationMinutes: args.durationMinutes,
      notes: args.notes,
      recordedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateDizzinessRecord = internalMutation({
  args: {
    recordId: v.id("dizzinessRecords"),
    severity: v.number(),
    symptoms: v.optional(v.array(v.string())),
    durationMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { severity: args.severity };
    if (args.symptoms !== undefined) updates.symptoms = args.symptoms;
    if (args.durationMinutes !== undefined) updates.durationMinutes = args.durationMinutes;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.recordId, updates);

    return { success: true };
  },
});

// ============================================
// Helper Functions
// ============================================

function jsonResponse(data: AgentResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, message }, status);
}

async function parseBody(request: Request): Promise<RequestBody | null> {
  try {
    return (await request.json()) as RequestBody;
  } catch {
    return null;
  }
}

function isValidPatientId(id: unknown): id is Id<"patientProfiles"> {
  return typeof id === "string" && id.length > 0;
}

function isValidInsulinType(type: unknown): type is "rapid" | "basal" {
  return type === "rapid" || type === "basal";
}

// ============================================
// HTTP Actions - Glucometry
// ============================================

export const httpSaveGlucometry = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] save-glucometry body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.glucometry_data?.patient_id;
  const value = body.value ?? body.glucometry_data?.value;

  if (!isValidPatientId(patientId) || value === undefined) {
    return errorResponse("patient_id y value son requeridos");
  }

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agentTools.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agentTools.saveGlucoseRecord, {
    patientId: patientId as Id<"patientProfiles">,
    value: Number(value),
  });

  return jsonResponse({
    success: true,
    message: `Glucosa de ${value} mg/dL registrada correctamente`,
  });
});

export const httpUpdateGlucometry = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] update-glucometry body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.glucometry_data?.patient_id;
  const value = body.value ?? body.glucometry_data?.value;

  if (!isValidPatientId(patientId) || value === undefined) {
    return errorResponse("patient_id y value son requeridos");
  }

  // Find latest record
  const latest = await ctx.runQuery(internal.agentTools.getLatestGlucoseRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de glucosa para actualizar");
  }

  const oldValue = latest.value;

  await ctx.runMutation(internal.agentTools.updateGlucoseRecord, {
    recordId: latest._id,
    value: Number(value),
  });

  return jsonResponse({
    success: true,
    message: `Glucosa actualizada de ${oldValue} a ${value} mg/dL`,
  });
});

// ============================================
// HTTP Actions - Insulin
// ============================================

export const httpSaveInsulin = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] save-insulin body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.insulin_data?.patient_id;
  const dose = body.dose ?? body.insulin_data?.dose;
  const insulinType = body.insulin_type ?? body.insulin_data?.insulin_type;

  if (!isValidPatientId(patientId) || dose === undefined) {
    return errorResponse("patient_id y dose son requeridos");
  }

  if (!isValidInsulinType(insulinType)) {
    return errorResponse("insulin_type debe ser 'rapid' o 'basal'");
  }

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agentTools.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agentTools.saveInsulinRecord, {
    patientId: patientId as Id<"patientProfiles">,
    dose: Number(dose),
    insulinType,
  });

  const typeLabel = insulinType === "rapid" ? "rápida" : "basal";

  return jsonResponse({
    success: true,
    message: `Dosis de ${dose} unidades de insulina ${typeLabel} registrada`,
  });
});

export const httpUpdateInsulin = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] update-insulin body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.insulin_data?.patient_id;
  const dose = body.dose ?? body.insulin_data?.dose;
  const insulinType = body.insulin_type ?? body.insulin_data?.insulin_type;

  if (!isValidPatientId(patientId) || dose === undefined) {
    return errorResponse("patient_id y dose son requeridos");
  }

  if (!isValidInsulinType(insulinType)) {
    return errorResponse("insulin_type debe ser 'rapid' o 'basal'");
  }

  // Find latest record
  const latest = await ctx.runQuery(internal.agentTools.getLatestInsulinRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de insulina para actualizar");
  }

  const oldDose = latest.dose;

  await ctx.runMutation(internal.agentTools.updateInsulinRecord, {
    recordId: latest._id,
    dose: Number(dose),
    insulinType,
  });

  return jsonResponse({
    success: true,
    message: `Insulina actualizada de ${oldDose} a ${dose} unidades`,
  });
});

// ============================================
// HTTP Actions - Sleep
// ============================================

export const httpSaveSleep = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] save-sleep body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.sleep_data?.patient_id;
  const hours = body.hours ?? body.sleep_data?.hours;
  const quality = body.quality ?? body.sleep_data?.quality ?? 5; // Default quality = 5

  if (!isValidPatientId(patientId) || hours === undefined) {
    return errorResponse("patient_id y hours son requeridos");
  }

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agentTools.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agentTools.saveSleepRecord, {
    patientId: patientId as Id<"patientProfiles">,
    hours: Number(hours),
    quality: Number(quality),
  });

  return jsonResponse({
    success: true,
    message: `Registrado: dormiste ${hours} horas`,
  });
});

export const httpUpdateSleep = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] update-sleep body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.sleep_data?.patient_id;
  const hours = body.hours ?? body.sleep_data?.hours;
  const quality = body.quality ?? body.sleep_data?.quality ?? 5;

  if (!isValidPatientId(patientId) || hours === undefined) {
    return errorResponse("patient_id y hours son requeridos");
  }

  // Find latest record
  const latest = await ctx.runQuery(internal.agentTools.getLatestSleepRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de sueño para actualizar");
  }

  const oldHours = latest.hours;

  await ctx.runMutation(internal.agentTools.updateSleepRecord, {
    recordId: latest._id,
    hours: Number(hours),
    quality: Number(quality),
  });

  return jsonResponse({
    success: true,
    message: `Horas de sueño actualizadas de ${oldHours} a ${hours}`,
  });
});

// ============================================
// HTTP Actions - Stress
// ============================================

export const httpSaveStress = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] save-stress body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.stress_data?.patient_id;
  const level = body.level ?? body.stress_data?.level;
  const notes = body.notes ?? body.stress_data?.notes;

  if (!isValidPatientId(patientId) || level === undefined) {
    return errorResponse("patient_id y level son requeridos");
  }

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agentTools.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agentTools.saveStressRecord, {
    patientId: patientId as Id<"patientProfiles">,
    level: Number(level),
    notes: typeof notes === "string" ? notes : undefined,
  });

  return jsonResponse({
    success: true,
    message: `Nivel de estrés ${level}/10 registrado`,
  });
});

export const httpUpdateStress = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] update-stress body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.stress_data?.patient_id;
  const level = body.level ?? body.stress_data?.level;
  const notes = body.notes ?? body.stress_data?.notes;

  if (!isValidPatientId(patientId) || level === undefined) {
    return errorResponse("patient_id y level son requeridos");
  }

  // Find latest record
  const latest = await ctx.runQuery(internal.agentTools.getLatestStressRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de estrés para actualizar");
  }

  const oldLevel = latest.level;

  await ctx.runMutation(internal.agentTools.updateStressRecord, {
    recordId: latest._id,
    level: Number(level),
    notes: typeof notes === "string" ? notes : undefined,
  });

  return jsonResponse({
    success: true,
    message: `Estrés actualizado de ${oldLevel} a ${level}/10`,
  });
});

// ============================================
// HTTP Actions - Dizziness
// ============================================

export const httpSaveDizziness = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] save-dizziness body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.dizziness_data?.patient_id;
  const severity = body.severity ?? body.dizziness_data?.severity;
  const symptoms = body.symptoms ?? body.dizziness_data?.symptoms;
  const durationMinutes = body.duration_minutes ?? body.dizziness_data?.duration_minutes;
  const notes = body.notes ?? body.dizziness_data?.notes;

  if (!isValidPatientId(patientId) || severity === undefined) {
    return errorResponse("patient_id y severity son requeridos");
  }

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agentTools.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agentTools.saveDizzinessRecord, {
    patientId: patientId as Id<"patientProfiles">,
    severity: Number(severity),
    symptoms: Array.isArray(symptoms) ? symptoms : undefined,
    durationMinutes: typeof durationMinutes === "number" ? durationMinutes : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  return jsonResponse({
    success: true,
    message: `Mareo con severidad ${severity}/10 registrado`,
  });
});

export const httpUpdateDizziness = httpAction(async (ctx, request) => {
  const body = await parseBody(request);
  if (!body) {
    return errorResponse("Invalid JSON body");
  }

  console.log("[Agent] update-dizziness body:", JSON.stringify(body));

  const patientId = body.patient_id ?? body.dizziness_data?.patient_id;
  const severity = body.severity ?? body.dizziness_data?.severity;
  const symptoms = body.symptoms ?? body.dizziness_data?.symptoms;
  const durationMinutes = body.duration_minutes ?? body.dizziness_data?.duration_minutes;
  const notes = body.notes ?? body.dizziness_data?.notes;

  if (!isValidPatientId(patientId) || severity === undefined) {
    return errorResponse("patient_id y severity son requeridos");
  }

  // Find latest record
  const latest = await ctx.runQuery(internal.agentTools.getLatestDizzinessRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de mareos para actualizar");
  }

  const oldSeverity = latest.severity;

  await ctx.runMutation(internal.agentTools.updateDizzinessRecord, {
    recordId: latest._id,
    severity: Number(severity),
    symptoms: Array.isArray(symptoms) ? symptoms : undefined,
    durationMinutes: typeof durationMinutes === "number" ? durationMinutes : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  return jsonResponse({
    success: true,
    message: `Mareo actualizado de severidad ${oldSeverity} a ${severity}/10`,
  });
});
