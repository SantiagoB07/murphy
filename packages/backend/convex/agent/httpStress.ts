import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { parseAndValidate, errorResponse, successResponse } from "./helpers";
import { SaveStressSchema, UpdateStressSchema } from "./schemas";

// ============================================
// HTTP Actions - Stress
// ============================================

export const httpSaveStress = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, SaveStressSchema);
  if (!result.success) return result.response;

  const { patient_id, level, notes } = result.data;

  console.log("[Agent] save-stress:", { patient_id, level, notes });

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveStressRecord, {
    patientId: patient_id as Id<"patientProfiles">,
    level,
    notes,
  });

  return successResponse(`Nivel de estrés ${level}/10 registrado`);
});

export const httpUpdateStress = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, UpdateStressSchema);
  if (!result.success) return result.response;

  const { patient_id, level, notes } = result.data;

  console.log("[Agent] update-stress:", { patient_id, level, notes });

  // Find latest record
  const latest = await ctx.runQuery(internal.agent.queries.getLatestStressRecord, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de estrés para actualizar");
  }

  const oldLevel = latest.level;

  await ctx.runMutation(internal.agent.mutations.updateStressRecord, {
    recordId: latest._id,
    level,
    notes,
  });

  return successResponse(`Estrés actualizado de ${oldLevel} a ${level}/10`);
});
