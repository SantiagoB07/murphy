import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { parseAndValidate, errorResponse, successResponse } from "./helpers";
import { SaveGlucometrySchema, UpdateGlucometrySchema } from "./schemas";

// ============================================
// HTTP Actions - Glucometry
// ============================================

export const httpSaveGlucometry = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, SaveGlucometrySchema);
  if (!result.success) return result.response;

  const { patient_id, value } = result.data;

  console.log("[Agent] save-glucometry:", { patient_id, value });

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveGlucoseRecord, {
    patientId: patient_id as Id<"patientProfiles">,
    value,
  });

  return successResponse(`Glucosa de ${value} mg/dL registrada correctamente`);
});

export const httpUpdateGlucometry = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, UpdateGlucometrySchema);
  if (!result.success) return result.response;

  const { patient_id, value } = result.data;

  console.log("[Agent] update-glucometry:", { patient_id, value });

  // Find latest record
  const latest = await ctx.runQuery(internal.agent.queries.getLatestGlucoseRecord, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de glucosa para actualizar");
  }

  const oldValue = latest.value;

  await ctx.runMutation(internal.agent.mutations.updateGlucoseRecord, {
    recordId: latest._id,
    value,
  });

  return successResponse(`Glucosa actualizada de ${oldValue} a ${value} mg/dL`);
});
