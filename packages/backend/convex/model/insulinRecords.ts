import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";
import { InsulinType, getCurrentTime } from "../lib/validators";

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
 */
export async function createDoseRecord(
  ctx: MutationCtx,
  input: InsulinDoseInput
): Promise<{ id: Id<"insulinDoseRecords"> }> {
  const now = Date.now();
  const id = await ctx.db.insert("insulinDoseRecords", {
    patientId: input.patientId,
    dose: input.dose,
    insulinType: input.insulinType,
    scheduledTime: input.scheduledTime ?? getCurrentTime(),
    administeredAt: input.administeredAt ?? now,
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
