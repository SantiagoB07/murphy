import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseBody, errorResponse, successResponse } from "./helpers";
import { isValidPatientId } from "./types";

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
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveGlucoseRecord, {
    patientId: patientId as Id<"patientProfiles">,
    value: Number(value),
  });

  return successResponse(`Glucosa de ${value} mg/dL registrada correctamente`);
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
  const latest = await ctx.runQuery(internal.agent.queries.getLatestGlucoseRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de glucosa para actualizar");
  }

  const oldValue = latest.value;

  await ctx.runMutation(internal.agent.mutations.updateGlucoseRecord, {
    recordId: latest._id,
    value: Number(value),
  });

  return successResponse(`Glucosa actualizada de ${oldValue} a ${value} mg/dL`);
});
