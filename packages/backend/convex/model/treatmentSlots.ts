import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";
import { SlotType, InsulinType } from "../lib/validators";

// ============================================
// Types
// ============================================

export type TreatmentSlotInput = {
  patientId: Id<"patientProfiles">;
  type: SlotType;
  scheduledTime: string; // "HH:MM"
  label?: string;
  expectedDose?: number;
  insulinType?: InsulinType;
  isEnabled?: boolean;
};

export type TreatmentSlotUpdate = {
  scheduledTime?: string;
  label?: string;
  expectedDose?: number;
  insulinType?: InsulinType;
  isEnabled?: boolean;
};

// ============================================
// Load Operations
// ============================================

/**
 * Loads a treatment slot by ID with ownership verification
 * @throws Error if slot not found or unauthorized
 */
export async function loadById(
  ctx: QueryCtx | MutationCtx,
  { id, patientId }: { id: Id<"treatmentSlots">; patientId: Id<"patientProfiles"> }
): Promise<Doc<"treatmentSlots">> {
  const slot = await ctx.db.get(id);
  if (!slot) {
    throw new Error("Slot no encontrado");
  }
  if (slot.patientId !== patientId) {
    throw new Error("No autorizado");
  }
  return slot;
}

// ============================================
// List Operations
// ============================================

export type ListOptions = {
  patientId: Id<"patientProfiles">;
  type?: SlotType;
  enabledOnly?: boolean;
};

/**
 * Lists treatment slots for a patient with optional filtering
 * Results are sorted by scheduled time
 */
export async function listByPatient(
  ctx: QueryCtx | MutationCtx,
  options: ListOptions
): Promise<Doc<"treatmentSlots">[]> {
  const { patientId, type, enabledOnly } = options;

  let slots: Doc<"treatmentSlots">[];

  if (type) {
    slots = await ctx.db
      .query("treatmentSlots")
      .withIndex("by_patient_type", (q) =>
        q.eq("patientId", patientId).eq("type", type)
      )
      .collect();
  } else {
    slots = await ctx.db
      .query("treatmentSlots")
      .withIndex("by_patient_type", (q) => q.eq("patientId", patientId))
      .collect();
  }

  if (enabledOnly) {
    slots = slots.filter((s) => s.isEnabled);
  }

  // Sort by scheduled time
  slots.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  return slots;
}

/**
 * Lists enabled treatment slots by type
 * Convenience method for common use case
 */
export async function listEnabledByType(
  ctx: QueryCtx | MutationCtx,
  { patientId, type }: { patientId: Id<"patientProfiles">; type: SlotType }
): Promise<Doc<"treatmentSlots">[]> {
  const slots = await ctx.db
    .query("treatmentSlots")
    .withIndex("by_patient_type", (q) =>
      q.eq("patientId", patientId).eq("type", type)
    )
    .collect();

  // Filter enabled and sort by time
  return slots
    .filter((s) => s.isEnabled)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

// ============================================
// Create Operations
// ============================================

/**
 * Creates a new treatment slot
 */
export async function createSlot(
  ctx: MutationCtx,
  input: TreatmentSlotInput
): Promise<{ id: Id<"treatmentSlots"> }> {
  const id = await ctx.db.insert("treatmentSlots", {
    patientId: input.patientId,
    type: input.type,
    scheduledTime: input.scheduledTime,
    label: input.label,
    expectedDose: input.expectedDose,
    insulinType: input.insulinType,
    isEnabled: input.isEnabled ?? true,
    updatedAt: Date.now(),
  });
  return { id };
}

// ============================================
// Update Operations
// ============================================

/**
 * Updates a treatment slot (with ownership verification)
 */
export async function updateSlot(
  ctx: MutationCtx,
  { id, patientId, ...updates }: { id: Id<"treatmentSlots">; patientId: Id<"patientProfiles"> } & TreatmentSlotUpdate
): Promise<{ id: Id<"treatmentSlots"> }> {
  // Verify ownership
  await loadById(ctx, { id, patientId });

  await ctx.db.patch(id, {
    ...updates,
    updatedAt: Date.now(),
  });

  return { id };
}

/**
 * Toggles enabled status of a treatment slot
 */
export async function toggleSlot(
  ctx: MutationCtx,
  { id, patientId, isEnabled }: { id: Id<"treatmentSlots">; patientId: Id<"patientProfiles">; isEnabled: boolean }
): Promise<{ id: Id<"treatmentSlots"> }> {
  // Verify ownership
  await loadById(ctx, { id, patientId });

  await ctx.db.patch(id, {
    isEnabled,
    updatedAt: Date.now(),
  });

  return { id };
}

// ============================================
// Delete Operations
// ============================================

/**
 * Deletes a treatment slot (with ownership verification)
 */
export async function deleteSlot(
  ctx: MutationCtx,
  { id, patientId }: { id: Id<"treatmentSlots">; patientId: Id<"patientProfiles"> }
): Promise<{ id: Id<"treatmentSlots"> }> {
  // Verify ownership
  await loadById(ctx, { id, patientId });

  await ctx.db.delete(id);
  return { id };
}
