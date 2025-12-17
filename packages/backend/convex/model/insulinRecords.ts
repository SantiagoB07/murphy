import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";
import { InsulinType, getCurrentTime } from "../lib/validators";

// ============================================
// Helper Functions
// ============================================

/**
 * Helper: Get start of day timestamp for a given timestamp
 * Uses the timestamp as-is assuming the client sends it in their local timezone
 */
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Helper: Get end of day timestamp for a given timestamp
 */
function getEndOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

// ============================================
// Types - Dose Records
// ============================================

export type InsulinDoseInput = {
  patientId: Id<"patientProfiles">;
  dose: number;
  insulinType: InsulinType;
  scheduledTime?: string;
  administeredAt?: number;
  notes?: string;
};

export type InsulinDoseUpdate = {
  dose?: number;
  insulinType?: InsulinType;
  scheduledTime?: string;
  administeredAt?: number;
  notes?: string;
};

// ============================================
// Types - Schedules
// ============================================

export type InsulinScheduleInput = {
  patientId: Id<"patientProfiles">;
  insulinType: InsulinType;
  unitsPerDose: number;
  timesPerDay: number;
  notes?: string;
};

export type InsulinScheduleUpdate = {
  unitsPerDose?: number;
  timesPerDay?: number;
  notes?: string;
};

// ============================================
// Dose Records - Load Operations
// ============================================

/**
 * Loads an insulin dose record by ID with ownership verification
 * @throws Error if record not found or unauthorized
 */
export async function loadDoseById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"insulinDoseRecords">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"insulinDoseRecords">> {
  const record = await ctx.db.get(id);
  if (!record) {
    throw new Error("Registro no encontrado");
  }
  if (record.patientId !== patientId) {
    throw new Error("No autorizado");
  }
  return record;
}

/**
 * Gets the latest insulin dose record for a patient (no ownership check - for internal use)
 */
export async function getLatestDose(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"insulinDoseRecords"> | null> {
  return ctx.db
    .query("insulinDoseRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .first();
}

// ============================================
// Dose Records - List Operations
// ============================================

export type DoseListOptions = {
  patientId: Id<"patientProfiles">;
  limit?: number;
  startTimestamp?: number;
  endTimestamp?: number;
};

/**
 * Lists insulin dose records for a patient with optional filtering
 */
export async function listDosesByPatient(
  ctx: QueryCtx | MutationCtx,
  options: DoseListOptions
): Promise<Doc<"insulinDoseRecords">[]> {
  const { patientId, limit, startTimestamp, endTimestamp } = options;

  let records = await ctx.db
    .query("insulinDoseRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .collect();

  // Apply timestamp filters in memory
  if (startTimestamp) {
    records = records.filter((r) => r.administeredAt >= startTimestamp);
  }
  if (endTimestamp) {
    records = records.filter((r) => r.administeredAt <= endTimestamp);
  }

  // Apply limit
  if (limit) {
    records = records.slice(0, limit);
  }

  return records;
}

/**
 * Gets recent insulin doses
 */
export async function getRecentDoses(
  ctx: QueryCtx | MutationCtx,
  { patientId, limit = 10 }: { patientId: Id<"patientProfiles">; limit?: number }
): Promise<Doc<"insulinDoseRecords">[]> {
  return ctx.db
    .query("insulinDoseRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .take(limit);
}

// ============================================
// Dose Records - Create Operations
// ============================================

/**
 * Creates a new insulin dose record
 * Validates that the daily limit from the schedule is not exceeded
 */
export async function createDoseRecord(
  ctx: MutationCtx,
  input: InsulinDoseInput
): Promise<{ id: Id<"insulinDoseRecords"> }> {
  const now = Date.now();
  const administeredAt = input.administeredAt ?? now;

  // 1. Get the insulin schedule for this type
  const schedules = await listSchedulesByType(ctx, {
    patientId: input.patientId,
    insulinType: input.insulinType,
  });

  const schedule = schedules[0];
  if (!schedule) {
    throw new Error(
      `No hay configuración de insulina ${input.insulinType}. Por favor configura tu régimen primero.`
    );
  }

  // 2. Count today's records for this insulin type
  const dayStart = getStartOfDay(administeredAt);
  const dayEnd = getEndOfDay(administeredAt);

  const todayRecords = await listDosesByPatient(ctx, {
    patientId: input.patientId,
    startTimestamp: dayStart,
    endTimestamp: dayEnd,
  });

  const recordsOfType = todayRecords.filter(
    (r) => r.insulinType === input.insulinType
  );

  // 3. Validate daily limit
  if (recordsOfType.length >= schedule.timesPerDay) {
    throw new Error(
      `Ya registraste las ${schedule.timesPerDay} dosis de insulina ${input.insulinType === "rapid" ? "rápida" : "basal"} permitidas para hoy.`
    );
  }

  // 4. Proceed with creation
  const id = await ctx.db.insert("insulinDoseRecords", {
    patientId: input.patientId,
    dose: input.dose,
    insulinType: input.insulinType,
    scheduledTime: input.scheduledTime ?? getCurrentTime(),
    administeredAt,
    notes: input.notes,
  });
  return { id };
}

// ============================================
// Dose Records - Update Operations
// ============================================

/**
 * Updates an insulin dose record (with ownership verification)
 */
export async function updateDoseRecord(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"insulinDoseRecords">; patientId: Id<"patientProfiles"> } & InsulinDoseUpdate
): Promise<{ id: Id<"insulinDoseRecords"> }> {
  // Verify ownership
  await loadDoseById(ctx, { id, patientId });

  await ctx.db.patch(id, updates);
  return { id };
}

/**
 * Updates an insulin dose record by ID only (no ownership check - for internal use)
 */
export async function updateDoseRecordInternal(
  ctx: MutationCtx,
  { id, dose, insulinType }: { id: Id<"insulinDoseRecords">; dose: number; insulinType: InsulinType }
): Promise<{ id: Id<"insulinDoseRecords"> }> {
  await ctx.db.patch(id, { dose, insulinType });
  return { id };
}

// ============================================
// Dose Records - Delete Operations
// ============================================

/**
 * Deletes an insulin dose record (with ownership verification)
 */
export async function deleteDoseRecord(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"insulinDoseRecords">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"insulinDoseRecords"> }> {
  // Verify ownership
  await loadDoseById(ctx, { id, patientId });

  await ctx.db.delete(id);
  return { id };
}

// ============================================
// Schedules - Load Operations
// ============================================

/**
 * Loads an insulin schedule by ID with ownership verification
 * @throws Error if schedule not found or unauthorized
 */
export async function loadScheduleById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"insulinSchedules">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"insulinSchedules">> {
  const schedule = await ctx.db.get(id);
  if (!schedule) {
    throw new Error("Esquema no encontrado");
  }
  if (schedule.patientId !== patientId) {
    throw new Error("No autorizado");
  }
  return schedule;
}

// ============================================
// Schedules - List Operations
// ============================================

/**
 * Lists all insulin schedules for a patient
 */
export async function listSchedulesByPatient(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"insulinSchedules">[]> {
  return ctx.db
    .query("insulinSchedules")
    .withIndex("by_patient_type", (q) => q.eq("patientId", patientId))
    .collect();
}

/**
 * Gets insulin schedules by type
 */
export async function listSchedulesByType(
  ctx: QueryCtx | MutationCtx,
  { patientId, insulinType }: { patientId: Id<"patientProfiles">; insulinType: InsulinType }
): Promise<Doc<"insulinSchedules">[]> {
  return ctx.db
    .query("insulinSchedules")
    .withIndex("by_patient_type", (q) =>
      q.eq("patientId", patientId).eq("insulinType", insulinType)
    )
    .collect();
}

// ============================================
// Schedules - Create Operations
// ============================================

/**
 * Creates a new insulin schedule
 */
export async function createSchedule(
  ctx: MutationCtx,
  input: InsulinScheduleInput
): Promise<{ id: Id<"insulinSchedules"> }> {
  const id = await ctx.db.insert("insulinSchedules", {
    patientId: input.patientId,
    insulinType: input.insulinType,
    unitsPerDose: input.unitsPerDose,
    timesPerDay: input.timesPerDay,
    notes: input.notes,
    updatedAt: Date.now(),
  });
  return { id };
}

// ============================================
// Schedules - Update Operations
// ============================================

/**
 * Updates an insulin schedule (with ownership verification)
 */
export async function updateSchedule(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"insulinSchedules">; patientId: Id<"patientProfiles"> } & InsulinScheduleUpdate
): Promise<{ id: Id<"insulinSchedules"> }> {
  // Verify ownership
  await loadScheduleById(ctx, { id, patientId });

  await ctx.db.patch(id, {
    ...updates,
    updatedAt: Date.now(),
  });

  return { id };
}

/**
 * Creates or updates an insulin schedule (upsert by type)
 */
export async function upsertSchedule(
  ctx: MutationCtx,
  input: InsulinScheduleInput
): Promise<{ id: Id<"insulinSchedules">; updated: boolean }> {
  // Check if a schedule already exists for this type
  const existing = await ctx.db
    .query("insulinSchedules")
    .withIndex("by_patient_type", (q) =>
      q.eq("patientId", input.patientId).eq("insulinType", input.insulinType)
    )
    .first();

  if (existing) {
    // Update existing schedule
    await ctx.db.patch(existing._id, {
      unitsPerDose: input.unitsPerDose,
      timesPerDay: input.timesPerDay,
      notes: input.notes,
      updatedAt: Date.now(),
    });
    return { id: existing._id, updated: true };
  } else {
    // Create new schedule
    const result = await createSchedule(ctx, input);
    return { id: result.id, updated: false };
  }
}

// ============================================
// Schedules - Status & Helper Operations
// ============================================

export type InsulinDayStatus = {
  insulinType: InsulinType;
  configured: boolean;
  configuredDosesPerDay: number;
  unitsPerDose: number;
  dosesTakenToday: number;
  dosesRemaining: number;
  scheduleText: string; // e.g., "10 unidades, 4 veces al día (2 de 4 completadas hoy, quedan 2)"
};

/**
 * Gets the insulin status for today for a specific insulin type
 * Returns configuration + how many doses taken today
 */
export async function getInsulinDayStatus(
  ctx: QueryCtx | MutationCtx,
  { patientId, insulinType }: { patientId: Id<"patientProfiles">; insulinType: InsulinType }
): Promise<InsulinDayStatus> {
  // Get schedule
  const schedules = await listSchedulesByType(ctx, { patientId, insulinType });
  const schedule = schedules[0];

  if (!schedule) {
    return {
      insulinType,
      configured: false,
      configuredDosesPerDay: 0,
      unitsPerDose: 0,
      dosesTakenToday: 0,
      dosesRemaining: 0,
      scheduleText: "No configurada",
    };
  }

  // Count today's doses
  const now = Date.now();
  const dayStart = getStartOfDay(now);
  const dayEnd = getEndOfDay(now);

  const todayRecords = await listDosesByPatient(ctx, {
    patientId,
    startTimestamp: dayStart,
    endTimestamp: dayEnd,
  });

  const dosesTakenToday = todayRecords.filter(
    (r) => r.insulinType === insulinType
  ).length;

  const dosesRemaining = Math.max(0, schedule.timesPerDay - dosesTakenToday);

  // Build formatted text
  const scheduleText = `${schedule.unitsPerDose} unidades, ${schedule.timesPerDay} ${schedule.timesPerDay === 1 ? "vez" : "veces"} al día (${dosesTakenToday} de ${schedule.timesPerDay} completadas hoy, ${dosesRemaining === 0 ? "completo" : `quedan ${dosesRemaining}`})`;

  return {
    insulinType,
    configured: true,
    configuredDosesPerDay: schedule.timesPerDay,
    unitsPerDose: schedule.unitsPerDose,
    dosesTakenToday,
    dosesRemaining,
    scheduleText,
  };
}

// ============================================
// Schedules - Delete Operations
// ============================================

/**
 * Deletes an insulin schedule (with ownership verification)
 */
export async function deleteSchedule(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"insulinSchedules">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"insulinSchedules"> }> {
  // Verify ownership
  await loadScheduleById(ctx, { id, patientId });

  await ctx.db.delete(id);
  return { id };
}
