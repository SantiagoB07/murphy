import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Id, Doc } from "../_generated/dataModel";
import { getTodayDate } from "../lib/validators";

// ============================================
// Types
// ============================================

export type GlucoseSlot =
  | "before_breakfast"
  | "after_breakfast"
  | "before_lunch"
  | "after_lunch"
  | "before_dinner"
  | "after_dinner";

export type GlucoseRecordInput = {
  patientId: Id<"patientProfiles">;
  value: number;
  date: string;
  recordedAt?: number;
  slot?: GlucoseSlot;
  notes?: string;
};

export type GlucoseRecordUpdate = {
  value?: number;
  date?: string;
  recordedAt?: number;
  slot?: GlucoseSlot;
  notes?: string;
};

export type GlucoseStats = {
  count: number;
  average: number;
  min: number;
  max: number;
  inRange: number;
  belowRange: number;
  aboveRange: number;
};

// ============================================
// Load Operations
// ============================================

/**
 * Loads a glucose record by ID with ownership verification
 * @throws Error if record not found or unauthorized
 */
export async function loadById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"glucoseRecords">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"glucoseRecords">> {
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
 * Gets the latest glucose record for a patient (no ownership check - for internal use)
 */
export async function getLatestByPatient(
  ctx: QueryCtx | MutationCtx,
  patientId: Id<"patientProfiles">
): Promise<Doc<"glucoseRecords"> | null> {
  return ctx.db
    .query("glucoseRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .first();
}

// ============================================
// List Operations
// ============================================

export type ListOptions = {
  patientId: Id<"patientProfiles">;
  limit?: number;
  startDate?: string;
  endDate?: string;
};

/**
 * Lists glucose records for a patient with optional filtering
 */
export async function listByPatient(
  ctx: QueryCtx | MutationCtx,
  options: ListOptions
): Promise<Doc<"glucoseRecords">[]> {
  const { patientId, limit, startDate, endDate } = options;

  let records = await ctx.db
    .query("glucoseRecords")
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

/**
 * Gets glucose records for a specific date
 */
export async function listByDate(
  ctx: QueryCtx | MutationCtx,
  { patientId, date }: { patientId: Id<"patientProfiles">; date: string }
): Promise<Doc<"glucoseRecords">[]> {
  return ctx.db
    .query("glucoseRecords")
    .withIndex("by_patient_date", (q) =>
      q.eq("patientId", patientId).eq("date", date)
    )
    .order("desc")
    .collect();
}

/**
 * Gets recent glucose records
 */
export async function getRecent(
  ctx: QueryCtx | MutationCtx,
  { patientId, limit = 10 }: { patientId: Id<"patientProfiles">; limit?: number }
): Promise<Doc<"glucoseRecords">[]> {
  return ctx.db
    .query("glucoseRecords")
    .withIndex("by_patient_date", (q) => q.eq("patientId", patientId))
    .order("desc")
    .take(limit);
}

// ============================================
// Statistics
// ============================================

/**
 * Gets glucose statistics for a date range
 */
export async function getStats(
  ctx: QueryCtx | MutationCtx,
  { patientId, startDate, endDate }: { patientId: Id<"patientProfiles">; startDate: string; endDate: string }
): Promise<GlucoseStats> {
  const records = await ctx.db
    .query("glucoseRecords")
    .withIndex("by_patient_date", (q) =>
      q.eq("patientId", patientId)
        .gte("date", startDate)
        .lte("date", endDate)
    )
    .collect();

  if (records.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      inRange: 0,
      belowRange: 0,
      aboveRange: 0,
    };
  }

  const values = records.map((r) => r.value);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // Count values in range (70-180 mg/dL is typical target range)
  const inRange = values.filter((v) => v >= 70 && v <= 180).length;
  const belowRange = values.filter((v) => v < 70).length;
  const aboveRange = values.filter((v) => v > 180).length;

  return {
    count: records.length,
    average: Math.round(average),
    min,
    max,
    inRange,
    belowRange,
    aboveRange,
  };
}

// ============================================
// Create Operations
// ============================================

/**
 * Creates a new glucose record
 */
export async function createRecord(
  ctx: MutationCtx,
  input: GlucoseRecordInput
): Promise<{ id: Id<"glucoseRecords"> }> {
  const now = Date.now();
  const id = await ctx.db.insert("glucoseRecords", {
    patientId: input.patientId,
    value: input.value,
    date: input.date || getTodayDate(),
    recordedAt: input.recordedAt ?? now,
    slot: input.slot,
    notes: input.notes,
    updatedAt: now,
  });
  return { id };
}

// ============================================
// Update Operations
// ============================================

/**
 * Updates a glucose record (with ownership verification)
 */
export async function updateRecord(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"glucoseRecords">; patientId: Id<"patientProfiles"> } & GlucoseRecordUpdate
): Promise<{ id: Id<"glucoseRecords"> }> {
  // Verify ownership
  await loadById(ctx, { id, patientId });

  await ctx.db.patch(id, {
    ...updates,
    updatedAt: Date.now(),
  });

  return { id };
}

/**
 * Updates a glucose record by ID only (no ownership check - for internal use)
 */
export async function updateRecordInternal(
  ctx: MutationCtx,
  { id, value, slot }: { id: Id<"glucoseRecords">; value: number; slot?: GlucoseSlot }
): Promise<{ id: Id<"glucoseRecords"> }> {
  await ctx.db.patch(id, {
    value,
    slot,
    updatedAt: Date.now(),
  });
  return { id };
}

// ============================================
// Delete Operations
// ============================================

/**
 * Deletes a glucose record (with ownership verification)
 */
export async function deleteRecord(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"glucoseRecords">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"glucoseRecords"> }> {
  // Verify ownership
  await loadById(ctx, { id, patientId });

  await ctx.db.delete(id);
  return { id };
}
