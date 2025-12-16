import { httpAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { parseAndValidate, errorResponse, successResponse } from "./helpers";
import { SaveDizzinessSchema, UpdateDizzinessSchema } from "./schemas";

// ============================================
// HTTP Actions - Dizziness
// ============================================

export const httpSaveDizziness = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, SaveDizzinessSchema);
  if (!result.success) return result.response;

  const { patient_id, severity, symptoms, duration_minutes, notes } = result.data;

  console.log("[Agent] save-dizziness:", { patient_id, severity, symptoms, duration_minutes, notes });

  // Validate patient exists
  const patient = await ctx.runQuery(internal.agent.queries.getPatientById, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!patient) {
    return errorResponse("Paciente no encontrado", 404);
  }

  await ctx.runMutation(internal.agent.mutations.saveDizzinessRecord, {
    patientId: patient_id as Id<"patientProfiles">,
    severity,
    symptoms,
    durationMinutes: duration_minutes,
    notes,
  });

  return successResponse(`Mareo con severidad ${severity}/10 registrado`);
});

export const httpUpdateDizziness = httpAction(async (ctx, request) => {
  const result = await parseAndValidate(request, UpdateDizzinessSchema);
  if (!result.success) return result.response;

  const { patient_id, severity, symptoms, duration_minutes, notes } = result.data;

  console.log("[Agent] update-dizziness:", { patient_id, severity, symptoms, duration_minutes, notes });

  // Find latest record
  const latest = await ctx.runQuery(internal.agent.queries.getLatestDizzinessRecord, {
    patientId: patient_id as Id<"patientProfiles">,
  });

  if (!latest) {
    return errorResponse("No hay registros de mareos para actualizar");
  }

  const oldSeverity = latest.severity;

  await ctx.runMutation(internal.agent.mutations.updateDizzinessRecord, {
    recordId: latest._id,
    severity,
    symptoms,
    durationMinutes: duration_minutes,
    notes,
  });

  return successResponse(`Mareo actualizado de severidad ${oldSeverity} a ${severity}/10`);
});
