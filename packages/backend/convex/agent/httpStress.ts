import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseBody, errorResponse, successResponse } from "./helpers";
import { isValidPatientId } from "./types";

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
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveStressRecord, {
    patientId: patientId as Id<"patientProfiles">,
    level: Number(level),
    notes: typeof notes === "string" ? notes : undefined,
  });

  return successResponse(`Nivel de estrés ${level}/10 registrado`);
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
  const latest = await ctx.runQuery(internal.agent.queries.getLatestStressRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de estrés para actualizar");
  }

  const oldLevel = latest.level;

  await ctx.runMutation(internal.agent.mutations.updateStressRecord, {
    recordId: latest._id,
    level: Number(level),
    notes: typeof notes === "string" ? notes : undefined,
  });

  return successResponse(`Estrés actualizado de ${oldLevel} a ${level}/10`);
});
