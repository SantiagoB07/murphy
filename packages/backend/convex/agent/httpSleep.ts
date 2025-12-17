import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { parseAndValidate, errorResponse, successResponse } from "./helpers";
import { SaveSleepSchema, UpdateSleepSchema } from "./schemas";

// ============================================
// HTTP Actions - Sleep
// ============================================

export const httpSaveSleep = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, SaveSleepSchema);
  if (!result.success) return result.response;

  const { patient_id, hours, quality } = result.data;

  console.log("[Agent] save-sleep:", { patient_id, hours, quality });

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveSleepRecord, {
    patientId: patient_id as Id<"patientProfiles">,
    hours,
    quality,
  });

  return successResponse(`Registrado: dormiste ${hours} horas`);
});

export const httpUpdateSleep = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, UpdateSleepSchema);
  if (!result.success) return result.response;

  const { patient_id, hours, quality } = result.data;

  console.log("[Agent] update-sleep:", { patient_id, hours, quality });

  // Find latest record
  const latest = await ctx.runQuery(internal.agent.queries.getLatestSleepRecord, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de sueño para actualizar");
  }

  const oldHours = latest.hours;

  await ctx.runMutation(internal.agent.mutations.updateSleepRecord, {
    recordId: latest._id,
    hours,
    quality,
  });

  return successResponse(`Horas de sueño actualizadas de ${oldHours} a ${hours}`);
});
