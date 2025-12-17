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

  // Try to save the insulin record
  try {
    await ctx.runMutation(internal.agent.mutations.saveInsulinRecord, {
      patientId: patient_id as Id<"patientProfiles">,
      dose,
      insulinType: insulin_type,
    });
  } catch (error: any) {
    // Check if it's a daily limit error or no schedule error
    const errorMessage = error?.message || String(error);
    
    if (errorMessage.includes("Ya registraste las")) {
      // Extract configured doses from error message if possible
      const match = errorMessage.match(/Ya registraste las (\d+) dosis/);
      const configuredDoses = match ? parseInt(match[1]) : null;
      
      return new Response(
        JSON.stringify({
          success: false,
          message: errorMessage,
          error_code: "DAILY_LIMIT_EXCEEDED",
          doses_taken_today: configuredDoses,
          configured_doses_per_day: configuredDoses,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    if (errorMessage.includes("No hay configuración de insulina")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: errorMessage,
          error_code: "NO_SCHEDULE_CONFIGURED",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Unknown error
    return errorResponse(errorMessage, 400);
  }

  // Get updated status after successful save
  const status = await ctx.runQuery(internal.agent.queries.getInsulinDayStatus, {
    patientId: patient_id as Id<"patientProfiles">,
    insulinType: insulin_type,
  });

  const typeLabel = insulin_type === "rapid" ? "rápida" : "basal";

  return new Response(
    JSON.stringify({
      success: true,
      message: `Dosis de ${dose} unidades de insulina ${typeLabel} registrada`,
      doses_taken_today: status.dosesTakenToday,
      doses_remaining: status.dosesRemaining,
      configured_doses_per_day: status.configuredDosesPerDay,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
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

  // Get updated status after successful update
  const status = await ctx.runQuery(internal.agent.queries.getInsulinDayStatus, {
    patientId: patient_id as Id<"patientProfiles">,
    insulinType: insulin_type,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: `Insulina actualizada de ${oldDose} a ${dose} unidades`,
      doses_taken_today: status.dosesTakenToday,
      doses_remaining: status.dosesRemaining,
      configured_doses_per_day: status.configuredDosesPerDay,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});
