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
 * Guarda una medición de glucosa del paciente
 */
export const saveGlucose = createTool({
  description:
    "Guarda una nueva medición de glucosa en sangre del paciente. Usa esta herramienta cuando el paciente te diga su nivel de glucosa.",
  args: z.object({
    value: z
      .number()
      .min(20)
      .max(600)
      .describe("Valor de glucosa en mg/dL (entre 20 y 600)"),
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
        "Momento del día en que se tomó la medición. before_breakfast = antes del desayuno, after_breakfast = después del desayuno, etc."
      ),
    notes: z
      .string()
      .optional()
      .describe("Notas adicionales sobre la medición"),
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
      before_breakfast: "antes del desayuno",
      after_breakfast: "después del desayuno",
      before_lunch: "antes del almuerzo",
      after_lunch: "después del almuerzo",
      before_dinner: "antes de la cena",
      after_dinner: "después de la cena",
    };

    const slotText = args.slot ? ` (${slotMessages[args.slot]})` : "";
    return `Glucosa de ${args.value} mg/dL guardada exitosamente${slotText}.`;
  },
});

/**
 * Actualiza la última medición de glucosa del paciente
 */
export const updateGlucose = createTool({
  description:
    "Corrige la última medición de glucosa del paciente. Usa esta herramienta cuando el paciente quiera corregir su última glucosa registrada.",
  args: z.object({
    value: z
      .number()
      .min(20)
      .max(600)
      .describe("Nuevo valor de glucosa en mg/dL"),
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
      .describe("Momento del día (opcional)"),
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
      return "No hay registros de glucosa para actualizar.";
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

    return `Glucosa actualizada de ${oldValue} a ${args.value} mg/dL.`;
  },
});

// ============================================
// Insulin Tools
// ============================================

/**
 * Guarda una dosis de insulina del paciente
 */
export const saveInsulin = createTool({
  description:
    "Guarda una nueva dosis de insulina del paciente. IMPORTANTE: Siempre pregunta qué tipo de insulina (rápida o basal) si el paciente no lo menciona.",
  args: z.object({
    dose: z.number().min(1).max(100).describe("Dosis en unidades de insulina"),
    insulinType: z
      .enum(["rapid", "basal"])
      .describe("Tipo de insulina: 'rapid' para rápida, 'basal' para basal"),
    notes: z.string().optional().describe("Notas adicionales"),
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

      const typeLabel = args.insulinType === "rapid" ? "rápida" : "basal";
      return `Dosis de ${args.dose} unidades de insulina ${typeLabel} registrada.`;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("Ya registraste las")) {
        return errorMessage;
      }
      if (errorMessage.includes("No hay configuración de insulina")) {
        return "No tienes configurada tu insulina. Por favor configura tu régimen primero en la aplicación Murphy.";
      }
      return `Error al guardar insulina: ${errorMessage}`;
    }
  },
});

/**
 * Actualiza la última dosis de insulina del paciente
 */
export const updateInsulin = createTool({
  description:
    "Corrige la última dosis de insulina del paciente. Usa esta herramienta cuando el paciente quiera corregir su última dosis.",
  args: z.object({
    dose: z.number().min(1).max(100).describe("Nueva dosis en unidades"),
    insulinType: z
      .enum(["rapid", "basal"])
      .describe("Tipo de insulina de la dosis a corregir"),
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
      return "No hay registros de insulina para actualizar.";
    }

    const oldDose = latest.dose;

    await ctx.runMutation(internal.agent.mutations.updateInsulinRecord, {
      recordId: latest._id,
      dose: args.dose,
      insulinType: args.insulinType,
    });

    return `Insulina actualizada de ${oldDose} a ${args.dose} unidades.`;
  },
});

// ============================================
// Sleep Tools
// ============================================

/**
 * Guarda las horas de sueño del paciente
 */
export const saveSleep = createTool({
  description:
    "Guarda las horas de sueño del paciente. Usa esta herramienta cuando el paciente te diga cuántas horas durmió y la calidad.",
  args: z.object({
    hours: z.number().min(0).max(24).describe("Horas de sueño"),
    quality: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Calidad del sueño del 1 al 10 (opcional)"),
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

    return `Registrado: dormiste ${args.hours} horas.`;
  },
});

/**
 * Actualiza el último registro de sueño del paciente
 */
export const updateSleep = createTool({
  description:
    "Corrige el último registro de sueño del paciente. Usa esta herramienta cuando el paciente quiera corregir sus horas de sueño.",
  args: z.object({
    hours: z.number().min(0).max(24).describe("Nuevas horas de sueño"),
    quality: z
      .number()
      .min(1)
      .max(10)
      .optional()
      .describe("Nueva calidad del sueño"),
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
      return "No hay registros de sueño para actualizar.";
    }

    const oldHours = latest.hours;

    await ctx.runMutation(internal.agent.mutations.updateSleepRecord, {
      recordId: latest._id,
      hours: args.hours,
      quality: args.quality ?? latest.quality,
    });

    return `Horas de sueño actualizadas de ${oldHours} a ${args.hours}.`;
  },
});

// ============================================
// Stress Tools
// ============================================

/**
 * Guarda un registro de estrés/ansiedad del paciente
 */
export const saveStress = createTool({
  description:
    "Guarda si el paciente tuvo estrés o ansiedad. Usa esta herramienta cuando el paciente mencione que tuvo estrés o ansiedad durante el día. ANTES de guardar, pregunta brevemente por el contexto.",
  args: z.object({
    level: z
      .number()
      .min(1)
      .max(10)
      .describe("Nivel de estrés del 1 al 10 (1=bajo, 10=muy alto)"),
    notes: z
      .string()
      .optional()
      .describe("Notas sobre qué causó el estrés"),
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

    return `Registrado: nivel de estrés ${args.level}/10.`;
  },
});

/**
 * Actualiza el último registro de estrés del paciente
 */
export const updateStress = createTool({
  description:
    "Corrige el último registro de estrés del paciente.",
  args: z.object({
    level: z.number().min(1).max(10).describe("Nuevo nivel de estrés"),
    notes: z.string().optional().describe("Nuevas notas"),
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
      return "No hay registros de estrés para actualizar.";
    }

    const oldLevel = latest.level;

    await ctx.runMutation(internal.agent.mutations.updateStressRecord, {
      recordId: latest._id,
      level: args.level,
      notes: args.notes,
    });

    return `Estrés actualizado de ${oldLevel} a ${args.level}/10.`;
  },
});

// ============================================
// Dizziness Tools
// ============================================

/**
 * Guarda un registro de mareos del paciente
 */
export const saveDizziness = createTool({
  description:
    "Guarda si el paciente tuvo mareos. Usa esta herramienta cuando el paciente mencione que tuvo mareos durante el día. ANTES de guardar, pregunta brevemente por el contexto.",
  args: z.object({
    severity: z
      .number()
      .min(1)
      .max(10)
      .describe("Severidad del mareo del 1 al 10"),
    durationMinutes: z
      .number()
      .optional()
      .describe("Duración del mareo en minutos"),
    notes: z.string().optional().describe("Notas adicionales"),
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

    return `Registrado: mareo con severidad ${args.severity}/10.`;
  },
});

/**
 * Actualiza el último registro de mareos del paciente
 */
export const updateDizziness = createTool({
  description:
    "Corrige el último registro de mareos del paciente.",
  args: z.object({
    severity: z.number().min(1).max(10).describe("Nueva severidad"),
    durationMinutes: z.number().optional().describe("Nueva duración en minutos"),
    notes: z.string().optional().describe("Nuevas notas"),
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
      return "No hay registros de mareos para actualizar.";
    }

    const oldSeverity = latest.severity;

    await ctx.runMutation(internal.agent.mutations.updateDizzinessRecord, {
      recordId: latest._id,
      severity: args.severity,
      durationMinutes: args.durationMinutes,
      notes: args.notes,
    });

    return `Mareo actualizado de severidad ${oldSeverity} a ${args.severity}/10.`;
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
