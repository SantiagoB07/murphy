import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseBody, errorResponse, successResponse } from "./helpers";
import { isValidPatientId } from "./types";
import { isValidInsulinType, InsulinType } from "../lib/validators";

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
    console.error("[Agent] Missing patient_id or dose");
    return errorResponse("patient_id y dose son requeridos");
  }

  if (!isValidInsulinType(insulinType)) {
    console.error("[Agent] Invalid insulin type:", insulinType);
    return errorResponse("insulin_type debe ser 'rapid' o 'basal'");
  }

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveInsulinRecord, {
    patientId: patientId as Id<"patientProfiles">,
    dose: Number(dose),
    insulinType: insulinType as InsulinType,
  });

  const typeLabel = insulinType === "rapid" ? "rápida" : "basal";

  return successResponse(`Dosis de ${dose} unidades de insulina ${typeLabel} registrada`);
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
  const latest = await ctx.runQuery(internal.agent.queries.getLatestInsulinRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de insulina para actualizar");
  }

  const oldDose = latest.dose;

  await ctx.runMutation(internal.agent.mutations.updateInsulinRecord, {
    recordId: latest._id,
    dose: Number(dose),
    insulinType: insulinType as InsulinType,
  });

  return successResponse(`Insulina actualizada de ${oldDose} a ${dose} unidades`);
});
