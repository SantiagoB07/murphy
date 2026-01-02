import { z } from "zod";
import { createTool } from "@convex-dev/agent";
import type { ToolCtx } from "@convex-dev/agent";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Contexto personalizado que incluye patientId
 * Se pasa al agente al llamar generateText
 */
export type KapsoToolCtx = ToolCtx & {
  patientId: Id<"patientProfiles">;
};

// ============================================
// Glucose Tools
// ============================================

/**
 * Saves a patient's blood glucose measurement
 */
export const saveGlucose = createTool({
  description:
    "Saves a new blood glucose measurement for the patient. Use this tool when the patient tells you their glucose level.",
  args: z.object({
    value: z
      .number()
      .min(20)
      .max(600)
      .describe("Glucose value in mg/dL (between 20 and 600)"),
    slot: z
      .enum([
        "before_breakfast",
        "after_breakfast",
        "before_lunch",
        "after_lunch",
        "before_dinner",
        "after_dinner",
      ])
      .optional()
      .describe(
        "Time of day when the measurement was taken. before_breakfast = before breakfast, after_breakfast = after breakfast, etc."
      ),
    notes: z
      .string()
      .optional()
      .describe("Additional notes about the measurement"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: {
      value: number;
      slot?:
        | "before_breakfast"
        | "after_breakfast"
        | "before_lunch"
        | "after_lunch"
        | "before_dinner"
        | "after_dinner";
      notes?: string;
    }
  ): Promise<string> => {
    await ctx.runMutation(internal.agent.mutations.saveGlucoseRecord, {
      patientId: ctx.patientId,
      value: args.value,
      slot: args.slot,
      notes: args.notes,
    });

    const slotMessages: Record<string, string> = {
      before_breakfast: "before breakfast",
      after_breakfast: "after breakfast",
      before_lunch: "before lunch",
      after_lunch: "after lunch",
      before_dinner: "before dinner",
      after_dinner: "after dinner",
    };

    const slotText = args.slot ? ` (${slotMessages[args.slot]})` : "";
    return `Glucose of ${args.value} mg/dL saved successfully${slotText}.`;
  },
});

/**
 * Updates the patient's last glucose measurement
 */
export const updateGlucose = createTool({
  description:
    "Corrects the patient's last glucose measurement. Use this tool when the patient wants to correct their last recorded glucose.",
  args: z.object({
    value: z
      .number()
      .min(20)
      .max(600)
      .describe("New glucose value in mg/dL"),
    slot: z
      .enum([
        "before_breakfast",
        "after_breakfast",
        "before_lunch",
        "after_lunch",
        "before_dinner",
        "after_dinner",
      ])
      .optional()
      .describe("Time of day (optional)"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { value: number; slot?: string }
  ): Promise<string> => {
    const latest = await ctx.runQuery(
      internal.agent.queries.getLatestGlucoseRecord,
      { patientId: ctx.patientId }
    );

    if (!latest) {
      return "No glucose records to update.";
    }

    const oldValue = latest.value;

    await ctx.runMutation(internal.agent.mutations.updateGlucoseRecord, {
      recordId: latest._id,
      value: args.value,
      slot: args.slot as
        | "before_breakfast"
        | "after_breakfast"
        | "before_lunch"
        | "after_lunch"
        | "before_dinner"
        | "after_dinner"
        | undefined,
    });

    return `Glucose updated from ${oldValue} to ${args.value} mg/dL.`;
  },
});

// ============================================
// Insulin Tools
// ============================================

/**
 * Saves a patient's insulin dose
 */
export const saveInsulin = createTool({
  description:
    "Saves a new insulin dose for the patient. IMPORTANT: Always ask what type of insulin (rapid or basal) if the patient doesn't mention it.",
  args: z.object({
    dose: z.number().min(1).max(100).describe("Dose in insulin units"),
    insulinType: z
      .enum(["rapid", "basal"])
      .describe("Type of insulin: 'rapid' for rapid-acting, 'basal' for basal"),
    notes: z.string().optional().describe("Additional notes"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { dose: number; insulinType: "rapid" | "basal"; notes?: string }
  ): Promise<string> => {
    try {
      await ctx.runMutation(internal.agent.mutations.saveInsulinRecord, {
        patientId: ctx.patientId,
        dose: args.dose,
        insulinType: args.insulinType,
        notes: args.notes,
      });

      const typeLabel = args.insulinType === "rapid" ? "rapid" : "basal";
      return `${args.dose} units of ${typeLabel} insulin recorded.`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("Ya registraste las")) {
        return "You've already recorded all your insulin doses for today.";
      }
      if (errorMessage.includes("No hay configuración de insulina")) {
        return "You don't have insulin configured. Please set up your regimen first in the Murphy app.";
      }
      return `Error saving insulin: ${errorMessage}`;
    }
  },
});

/**
 * Updates the patient's last insulin dose
 */
export const updateInsulin = createTool({
  description:
    "Corrects the patient's last insulin dose. Use this tool when the patient wants to correct their last dose.",
  args: z.object({
    dose: z.number().min(1).max(100).describe("New dose in units"),
    insulinType: z
      .enum(["rapid", "basal"])
      .describe("Type of insulin of the dose to correct"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { dose: number; insulinType: "rapid" | "basal" }
  ): Promise<string> => {
    const latest = await ctx.runQuery(
      internal.agent.queries.getLatestInsulinRecord,
      { patientId: ctx.patientId }
    );

    if (!latest) {
      return "No insulin records to update.";
    }

    const oldDose = latest.dose;

    await ctx.runMutation(internal.agent.mutations.updateInsulinRecord, {
      recordId: latest._id,
      dose: args.dose,
      insulinType: args.insulinType,
    });

    return `Insulin updated from ${oldDose} to ${args.dose} units.`;
  },
});

// ============================================
// Sleep Tools
// ============================================

/**
 * Saves the patient's sleep hours
 */
export const saveSleep = createTool({
  description:
    "Saves the patient's sleep hours. Use this tool when the patient tells you how many hours they slept and the quality.",
  args: z.object({
    hours: z.number().min(0).max(24).describe("Hours of sleep"),
    quality: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Sleep quality from 1 to 10 (optional)"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { hours: number; quality?: number }
  ): Promise<string> => {
    await ctx.runMutation(internal.agent.mutations.saveSleepRecord, {
      patientId: ctx.patientId,
      hours: args.hours,
      quality: args.quality ?? 5,
    });

    return `Recorded: you slept ${args.hours} hours.`;
  },
});

/**
 * Updates the patient's last sleep record
 */
export const updateSleep = createTool({
  description:
    "Corrects the patient's last sleep record. Use this tool when the patient wants to correct their sleep hours.",
  args: z.object({
    hours: z.number().min(0).max(24).describe("New hours of sleep"),
    quality: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("New sleep quality"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { hours: number; quality?: number }
  ): Promise<string> => {
    const latest = await ctx.runQuery(
      internal.agent.queries.getLatestSleepRecord,
      { patientId: ctx.patientId }
    );

    if (!latest) {
      return "No sleep records to update.";
    }

    const oldHours = latest.hours;

    await ctx.runMutation(internal.agent.mutations.updateSleepRecord, {
      recordId: latest._id,
      hours: args.hours,
      quality: args.quality ?? latest.quality,
    });

    return `Sleep hours updated from ${oldHours} to ${args.hours}.`;
  },
});

// ============================================
// Stress Tools
// ============================================

/**
 * Saves a patient's stress/anxiety record
 */
export const saveStress = createTool({
  description:
    "Saves if the patient had stress or anxiety. Use this tool when the patient mentions they had stress or anxiety during the day. BEFORE saving, briefly ask for context.",
  args: z.object({
    level: z
      .number()
      .min(1)
      .max(10)
      .describe("Stress level from 1 to 10 (1=low, 10=very high)"),
    notes: z
      .string()
      .optional()
      .describe("Notes about what caused the stress"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { level: number; notes?: string }
  ): Promise<string> => {
    await ctx.runMutation(internal.agent.mutations.saveStressRecord, {
      patientId: ctx.patientId,
      level: args.level,
      notes: args.notes,
    });

    return `Recorded: stress level ${args.level}/10.`;
  },
});

/**
 * Updates the patient's last stress record
 */
export const updateStress = createTool({
  description:
    "Corrects the patient's last stress record.",
  args: z.object({
    level: z.number().min(1).max(10).describe("New stress level"),
    notes: z.string().optional().describe("New notes"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { level: number; notes?: string }
  ): Promise<string> => {
    const latest = await ctx.runQuery(
      internal.agent.queries.getLatestStressRecord,
      { patientId: ctx.patientId }
    );

    if (!latest) {
      return "No stress records to update.";
    }

    const oldLevel = latest.level;

    await ctx.runMutation(internal.agent.mutations.updateStressRecord, {
      recordId: latest._id,
      level: args.level,
      notes: args.notes,
    });

    return `Stress updated from ${oldLevel} to ${args.level}/10.`;
  },
});

// ============================================
// Dizziness Tools
// ============================================

/**
 * Saves a patient's dizziness record
 */
export const saveDizziness = createTool({
  description:
    "Saves if the patient had dizziness. Use this tool when the patient mentions they had dizziness during the day. BEFORE saving, briefly ask for context.",
  args: z.object({
    severity: z
      .number()
      .min(1)
      .max(10)
      .describe("Dizziness severity from 1 to 10"),
    durationMinutes: z
      .number()
      .optional()
      .describe("Duration of dizziness in minutes"),
    notes: z.string().optional().describe("Additional notes"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { severity: number; durationMinutes?: number; notes?: string }
  ): Promise<string> => {
    await ctx.runMutation(internal.agent.mutations.saveDizzinessRecord, {
      patientId: ctx.patientId,
      severity: args.severity,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
    });

    return `Recorded: dizziness with severity ${args.severity}/10.`;
  },
});

/**
 * Updates the patient's last dizziness record
 */
export const updateDizziness = createTool({
  description:
    "Corrects the patient's last dizziness record.",
  args: z.object({
    severity: z.number().min(1).max(10).describe("New severity"),
    durationMinutes: z.number().optional().describe("New duration in minutes"),
    notes: z.string().optional().describe("New notes"),
  }),
  handler: async (
    ctx: KapsoToolCtx,
    args: { severity: number; durationMinutes?: number; notes?: string }
  ): Promise<string> => {
    const latest = await ctx.runQuery(
      internal.agent.queries.getLatestDizzinessRecord,
      { patientId: ctx.patientId }
    );

    if (!latest) {
      return "No dizziness records to update.";
    }

    const oldSeverity = latest.severity;

    await ctx.runMutation(internal.agent.mutations.updateDizzinessRecord, {
      recordId: latest._id,
      severity: args.severity,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
    });

    return `Dizziness updated from severity ${oldSeverity} to ${args.severity}/10.`;
  },
});

// ============================================
// Export all tools as a single object
// ============================================

export const kapsoTools = {
  // Glucose
  saveGlucose,
  updateGlucose,
  // Insulin
  saveInsulin,
  updateInsulin,
  // Sleep
  saveSleep,
  updateSleep,
  // Stress
  saveStress,
  updateStress,
  // Dizziness
  saveDizziness,
  updateDizziness,
};
