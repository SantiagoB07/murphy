import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseAndValidate, errorResponse, successResponse } from "./helpers";
import { SaveInsulinSchema, UpdateInsulinSchema } from "./schemas";

// ============================================
// HTTP Actions - Insulin
// ============================================

export const httpSaveInsulin = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, SaveInsulinSchema);
  if (!result.success) return result.response;

  const { patient_id, dose, insulin_type } = result.data;

  console.log("[Agent] save-insulin:", { patient_id, dose, insulin_type });

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveInsulinRecord, {
    patientId: patient_id as Id<"patientProfiles">,
    dose,
    insulinType: insulin_type,
  });

  const typeLabel = insulin_type === "rapid" ? "rápida" : "basal";

  return successResponse(`Dosis de ${dose} unidades de insulina ${typeLabel} registrada`);
});

export const httpUpdateInsulin = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, UpdateInsulinSchema);
  if (!result.success) return result.response;

  const { patient_id, dose, insulin_type } = result.data;

  console.log("[Agent] update-insulin:", { patient_id, dose, insulin_type });

  // Find latest record
  const latest = await ctx.runQuery(internal.agent.queries.getLatestInsulinRecord, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de insulina para actualizar");
  }

  const oldDose = latest.dose;

  await ctx.runMutation(internal.agent.mutations.updateInsulinRecord, {
    recordId: latest._id,
    dose,
    insulinType: insulin_type,
  });

  return successResponse(`Insulina actualizada de ${oldDose} a ${dose} unidades`);
});
