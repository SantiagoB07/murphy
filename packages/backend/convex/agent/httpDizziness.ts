import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseBody, errorResponse, successResponse } from "./helpers";
import { isValidPatientId } from "./types";

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
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveDizzinessRecord, {
    patientId: patientId as Id<"patientProfiles">,
    severity: Number(severity),
    symptoms: Array.isArray(symptoms) ? symptoms : undefined,
    durationMinutes: typeof durationMinutes === "number" ? durationMinutes : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  return successResponse(`Mareo con severidad ${severity}/10 registrado`);
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
  const latest = await ctx.runQuery(internal.agent.queries.getLatestDizzinessRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de mareos para actualizar");
  }

  const oldSeverity = latest.severity;

  await ctx.runMutation(internal.agent.mutations.updateDizzinessRecord, {
    recordId: latest._id,
    severity: Number(severity),
    symptoms: Array.isArray(symptoms) ? symptoms : undefined,
    durationMinutes: typeof durationMinutes === "number" ? durationMinutes : undefined,
    notes: typeof notes === "string" ? notes : undefined,
  });

  return successResponse(`Mareo actualizado de severidad ${oldSeverity} a ${severity}/10`);
});
