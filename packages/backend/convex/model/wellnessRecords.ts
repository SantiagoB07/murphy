import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { getDateRange } from "../lib/validators";

// ============================================
// Sleep Records - Types
// ============================================

export type SleepRecordInput = {
  patientId: Id<"patientProfiles">;
  hours: number;
  quality: number;
  date: string;
};

export type SleepRecordUpdate = {
  hours?: number;
  quality?: number;
};

// ============================================
// Sleep Records - Load Operations
// ============================================

/**
 * Loads a sleep record by ID with ownership verification
 * @throws Error if record not found or unauthorized
 */
export async function loadSleepById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"sleepRecords">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"sleepRecords">> {
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
 * Gets the latest sleep record for a patient (no ownership check - for internal use)
 */
export async function getLatestSleep(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"sleepRecords"> | null> {
  return ctx.db
    .query("sleepRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .first();
}

/**
 * Gets sleep record for a specific date
 */
export async function getSleepByDate(
  ctx: QueryCtx | MutationCtx,
  { patientId, date }: { patientId: Id<"patientProfiles">; date: string }
): Promise<Doc<"sleepRecords"> | null> {
  return ctx.db
    .query("sleepRecords")
    .withIndex("by_patient_date", (q) =>
      q.eq("patientId", patientId).eq("date", date)
    )
    .unique();
}

// ============================================
// Sleep Records - List Operations
// ============================================

export type SleepListOptions = {
  patientId: Id<"patientProfiles">;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

/**
 * Lists sleep records for a patient with optional filtering
 */
export async function listSleepByPatient(
  ctx: QueryCtx | MutationCtx,
  options: SleepListOptions
): Promise<Doc<"sleepRecords">[]> {
  const { patientId, limit, startDate, endDate } = options;

  let records = await ctx.db
    .query("sleepRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .collect();

  // Apply date filters in memory
  if (startDate) {
    records = records.filter((r) => r.date >= startDate);
  }
  if (endDate) {
    records = records.filter((r) => r.date <= endDate);
  }

  // Apply limit
  if (limit) {
    records = records.slice(0, limit);
  }

  return records;
}

// ============================================
// Sleep Records - Create/Update Operations
// ============================================

/**
 * Creates a new sleep record
 * @throws Error if record already exists for the date
 */
export async function createSleepRecord(
  ctx: MutationCtx,
  input: SleepRecordInput
): Promise<{ id: Id<"sleepRecords"> }> {
  // Check if a record already exists for this date
  const existing = await getSleepByDate(ctx, {
    patientId: input.patientId,
    date: input.date,
  });

  if (existing) {
    throw new Error("Ya existe un registro de sueño para esta fecha");
  }

  const id = await ctx.db.insert("sleepRecords", {
    patientId: input.patientId,
    hours: input.hours,
    quality: input.quality,
    date: input.date,
  });
  return { id };
}

/**
 * Creates or updates a sleep record for a given date (upsert)
 */
export async function upsertSleepRecord(
  ctx: MutationCtx,
  input: SleepRecordInput
): Promise<{ id: Id<"sleepRecords">; updated: boolean }> {
  const existing = await getSleepByDate(ctx, {
    patientId: input.patientId,
    date: input.date,
  });

  if (existing) {
    await ctx.db.patch(existing._id, {
      hours: input.hours,
      quality: input.quality,
    });
    return { id: existing._id, updated: true };
  }

  const id = await ctx.db.insert("sleepRecords", {
    patientId: input.patientId,
    hours: input.hours,
    quality: input.quality,
    date: input.date,
  });
  return { id, updated: false };
}

/**
 * Updates a sleep record (with ownership verification)
 */
export async function updateSleepRecord(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"sleepRecords">; patientId: Id<"patientProfiles"> } & SleepRecordUpdate
): Promise<{ id: Id<"sleepRecords"> }> {
  await loadSleepById(ctx, { id, patientId });
  await ctx.db.patch(id, updates);
  return { id };
}

/**
 * Updates a sleep record by ID only (no ownership check - for internal use)
 */
export async function updateSleepRecordInternal(
  ctx: MutationCtx,
  { id, hours, quality }: { id: Id<"sleepRecords">; hours: number; quality: number }
): Promise<{ id: Id<"sleepRecords"> }> {
  await ctx.db.patch(id, { hours, quality });
  return { id };
}

// ============================================
// Sleep Records - Delete Operations
// ============================================

/**
 * Deletes a sleep record (with ownership verification)
 */
export async function deleteSleepRecord(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"sleepRecords">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"sleepRecords"> }> {
  await loadSleepById(ctx, { id, patientId });
  await ctx.db.delete(id);
  return { id };
}

// ============================================
// Stress Records - Types
// ============================================

export type StressRecordInput = {
  patientId: Id<"patientProfiles">;
  level: number;
  notes?: string;
  recordedAt?: number;
};

export type StressRecordUpdate = {
  level?: number;
  notes?: string;
};

// ============================================
// Stress Records - Load Operations
// ============================================

/**
 * Loads a stress record by ID with ownership verification
 * @throws Error if record not found or unauthorized
 */
export async function loadStressById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"stressRecords">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"stressRecords">> {
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
 * Gets the latest stress record for a patient (no ownership check - for internal use)
 */
export async function getLatestStress(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"stressRecords"> | null> {
  return ctx.db
    .query("stressRecords")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .order("desc")
    .first();
}

/**
 * Gets stress record for a specific date (first record of the day)
 */
export async function getStressByDate(
  ctx: QueryCtx | MutationCtx,
  { patientId, date }: { patientId: Id<"patientProfiles">; date: string }
): Promise<Doc<"stressRecords"> | null> {
  const { startOfDay, endOfDay } = getDateRange(date);

  const records = await ctx.db
    .query("stressRecords")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .collect();

  // Filter in memory for date range
  return records.find((r) => r.recordedAt >= startOfDay && r.recordedAt <= endOfDay) ?? null;
}

// ============================================
// Stress Records - List Operations
// ============================================

export type StressListOptions = {
  patientId: Id<"patientProfiles">;
  limit?: number;
  startTimestamp?: number;
  endTimestamp?: number;
};

/**
 * Lists stress records for a patient with optional filtering
 */
export async function listStressByPatient(
  ctx: QueryCtx | MutationCtx,
  options: StressListOptions
): Promise<Doc<"stressRecords">[]> {
  const { patientId, limit, startTimestamp, endTimestamp } = options;

  let records = await ctx.db
    .query("stressRecords")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .order("desc")
    .collect();

  // Apply timestamp filters
  if (startTimestamp) {
    records = records.filter((r) => r.recordedAt >= startTimestamp);
  }
  if (endTimestamp) {
    records = records.filter((r) => r.recordedAt <= endTimestamp);
  }

  // Apply limit
  if (limit) {
    records = records.slice(0, limit);
  }

  return records;
}

// ============================================
// Stress Records - Create/Update Operations
// ============================================

/**
 * Creates a new stress record
 */
export async function createStressRecord(
  ctx: MutationCtx,
  input: StressRecordInput
): Promise<{ id: Id<"stressRecords"> }> {
  const id = await ctx.db.insert("stressRecords", {
    patientId: input.patientId,
    level: input.level,
    notes: input.notes,
    recordedAt: input.recordedAt ?? Date.now(),
  });
  return { id };
}

/**
 * Creates or updates a stress record for a given date (upsert)
 * Only one record per day is allowed
 */
export async function upsertStressRecord(
  ctx: MutationCtx,
  input: StressRecordInput & { date: string }
): Promise<{ id: Id<"stressRecords">; updated: boolean }> {
  const existing = await getStressByDate(ctx, {
    patientId: input.patientId,
    date: input.date,
  });

  if (existing) {
    await ctx.db.patch(existing._id, {
      level: input.level,
      notes: input.notes,
    });
    return { id: existing._id, updated: true };
  }

  // Use midday of the given date to avoid timezone edge cases
  const recordedAt = new Date(input.date + "T12:00:00").getTime();
  const id = await ctx.db.insert("stressRecords", {
    patientId: input.patientId,
    level: input.level,
    notes: input.notes,
    recordedAt,
  });
  return { id, updated: false };
}

/**
 * Updates a stress record (with ownership verification)
 */
export async function updateStressRecord(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"stressRecords">; patientId: Id<"patientProfiles"> } & StressRecordUpdate
): Promise<{ id: Id<"stressRecords"> }> {
  await loadStressById(ctx, { id, patientId });
  await ctx.db.patch(id, updates);
  return { id };
}

/**
 * Updates a stress record by ID only (no ownership check - for internal use)
 */
export async function updateStressRecordInternal(
  ctx: MutationCtx,
  { id, level, notes }: { id: Id<"stressRecords">; level: number; notes?: string }
): Promise<{ id: Id<"stressRecords"> }> {
  await ctx.db.patch(id, { level, notes });
  return { id };
}

// ============================================
// Stress Records - Delete Operations
// ============================================

/**
 * Deletes a stress record (with ownership verification)
 */
export async function deleteStressRecord(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"stressRecords">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"stressRecords"> }> {
  await loadStressById(ctx, { id, patientId });
  await ctx.db.delete(id);
  return { id };
}

// ============================================
// Dizziness Records - Types
// ============================================

export type DizzinessRecordInput = {
  patientId: Id<"patientProfiles">;
  severity: number;
  symptoms?: string[];
  durationMinutes?: number;
  notes?: string;
  recordedAt?: number;
};

export type DizzinessRecordUpdate = {
  severity?: number;
  symptoms?: string[];
  durationMinutes?: number;
  notes?: string;
};

// ============================================
// Dizziness Records - Load Operations
// ============================================

/**
 * Loads a dizziness record by ID with ownership verification
 * @throws Error if record not found or unauthorized
 */
export async function loadDizzinessById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"dizzinessRecords">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"dizzinessRecords">> {
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
 * Gets the latest dizziness record for a patient (no ownership check - for internal use)
 */
export async function getLatestDizziness(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"dizzinessRecords"> | null> {
  return ctx.db
    .query("dizzinessRecords")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .order("desc")
    .first();
}

/**
 * Gets dizziness record for a specific date (first record of the day)
 */
export async function getDizzinessByDate(
  ctx: QueryCtx | MutationCtx,
  { patientId, date }: { patientId: Id<"patientProfiles">; date: string }
): Promise<Doc<"dizzinessRecords"> | null> {
  const { startOfDay, endOfDay } = getDateRange(date);

  const records = await ctx.db
    .query("dizzinessRecords")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .collect();

  // Filter in memory for date range
  return records.find((r) => r.recordedAt >= startOfDay && r.recordedAt <= endOfDay) ?? null;
}

// ============================================
// Dizziness Records - List Operations
// ============================================

export type DizzinessListOptions = {
  patientId: Id<"patientProfiles">;
  limit?: number;
  startTimestamp?: number;
  endTimestamp?: number;
};

/**
 * Lists dizziness records for a patient with optional filtering
 */
export async function listDizzinessByPatient(
  ctx: QueryCtx | MutationCtx,
  options: DizzinessListOptions
): Promise<Doc<"dizzinessRecords">[]> {
  const { patientId, limit, startTimestamp, endTimestamp } = options;

  let records = await ctx.db
    .query("dizzinessRecords")
    .withIndex("by_patient", (q) => q.eq("patientId", patientId))
    .order("desc")
    .collect();

  // Apply timestamp filters
  if (startTimestamp) {
    records = records.filter((r) => r.recordedAt >= startTimestamp);
  }
  if (endTimestamp) {
    records = records.filter((r) => r.recordedAt <= endTimestamp);
  }

  // Apply limit
  if (limit) {
    records = records.slice(0, limit);
  }

  return records;
}

// ============================================
// Dizziness Records - Create/Update Operations
// ============================================

/**
 * Creates a new dizziness record
 */
export async function createDizzinessRecord(
  ctx: MutationCtx,
  input: DizzinessRecordInput
): Promise<{ id: Id<"dizzinessRecords"> }> {
  const id = await ctx.db.insert("dizzinessRecords", {
    patientId: input.patientId,
    severity: input.severity,
    symptoms: input.symptoms ?? [],
    durationMinutes: input.durationMinutes,
    notes: input.notes,
    recordedAt: input.recordedAt ?? Date.now(),
  });
  return { id };
}

/**
 * Creates or updates a dizziness record for a given date (upsert)
 * Only one record per day is allowed
 */
export async function upsertDizzinessRecord(
  ctx: MutationCtx,
  input: DizzinessRecordInput & { date: string }
): Promise<{ id: Id<"dizzinessRecords">; updated: boolean }> {
  const existing = await getDizzinessByDate(ctx, {
    patientId: input.patientId,
    date: input.date,
  });

  if (existing) {
    await ctx.db.patch(existing._id, {
      severity: input.severity,
      symptoms: input.symptoms ?? existing.symptoms,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
    });
    return { id: existing._id, updated: true };
  }

  // Use midday of the given date to avoid timezone edge cases
  const recordedAt = new Date(input.date + "T12:00:00").getTime();
  const id = await ctx.db.insert("dizzinessRecords", {
    patientId: input.patientId,
    severity: input.severity,
    symptoms: input.symptoms ?? [],
    durationMinutes: input.durationMinutes,
    notes: input.notes,
    recordedAt,
  });
  return { id, updated: false };
}

/**
 * Updates a dizziness record (with ownership verification)
 */
export async function updateDizzinessRecord(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"dizzinessRecords">; patientId: Id<"patientProfiles"> } & DizzinessRecordUpdate
): Promise<{ id: Id<"dizzinessRecords"> }> {
  await loadDizzinessById(ctx, { id, patientId });
  await ctx.db.patch(id, updates);
  return { id };
}

/**
 * Updates a dizziness record by ID only (no ownership check - for internal use)
 */
export async function updateDizzinessRecordInternal(
  ctx: MutationCtx,
  { id, severity, symptoms, durationMinutes, notes }: {
    id: Id<"dizzinessRecords">;
    severity: number;
    symptoms?: string[];
    durationMinutes?: number;
    notes?: string;
  }
): Promise<{ id: Id<"dizzinessRecords"> }> {
  const updates: Record<string, unknown> = { severity };
  if (symptoms !== undefined) updates.symptoms = symptoms;
  if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;
  if (notes !== undefined) updates.notes = notes;

  await ctx.db.patch(id, updates);
  return { id };
}

// ============================================
// Dizziness Records - Delete Operations
// ============================================

/**
 * Deletes a dizziness record (with ownership verification)
 */
export async function deleteDizzinessRecord(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"dizzinessRecords">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"dizzinessRecords"> }> {
  await loadDizzinessById(ctx, { id, patientId });
  await ctx.db.delete(id);
  return { id };
}
