import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseBody, errorResponse, successResponse } from "./helpers";
import { isValidPatientId } from "./types";

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
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveSleepRecord, {
    patientId: patientId as Id<"patientProfiles">,
    hours: Number(hours),
    quality: Number(quality),
  });

  return successResponse(`Registrado: dormiste ${hours} horas`);
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
  const latest = await ctx.runQuery(internal.agent.queries.getLatestSleepRecord, {
    patientId: patientId as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de sueño para actualizar");
  }

  const oldHours = latest.hours;

  await ctx.runMutation(internal.agent.mutations.updateSleepRecord, {
    recordId: latest._id,
    hours: Number(hours),
    quality: Number(quality),
  });

  return successResponse(`Horas de sueño actualizadas de ${oldHours} a ${hours}`);
});
