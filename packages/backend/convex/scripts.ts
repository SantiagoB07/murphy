import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Mapeo de "Momento del día" (CSV) a glucoseSlots (schema)
const slotMapping: Record<string, string> = {
  "Antes del desayuno": "before_breakfast",
  "Después del desayuno": "after_breakfast",
  "Antes del almuerzo": "before_lunch",
  "Después del almuerzo": "after_lunch",
  "Antes de la comida": "before_dinner",
  "Después de la comida": "after_dinner",
};

type GlucoseSlot =
  | "before_breakfast"
  | "after_breakfast"
  | "before_lunch"
  | "after_lunch"
  | "before_dinner"
  | "after_dinner";

/**
 * Internal mutation to bulk import glucose records from CSV data.
 *
 * Expected record format from CSV:
 * - fecha: "DD/MM/YYYY" (e.g., "17/12/2025")
 * - momentoDelDia: Spanish slot name (e.g., "Antes del desayuno")
 * - valor: number (mg/dL)
 * - hora: "HH:MM" (e.g., "08:05")
 */
export const importGlucoseRecords = internalMutation({
  args: {
    patientId: v.id("patientProfiles"),
    records: v.array(
      v.object({
        fecha: v.string(),
        momentoDelDia: v.string(),
        valor: v.number(),
        hora: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { patientId, records } = args;

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const record of records) {
      try {
        // Parse date from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = record.fecha.split("/");
        const dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        // Map Spanish slot name to schema slot
        const slot = slotMapping[record.momentoDelDia] as GlucoseSlot | undefined;
        if (!slot) {
          errors.push(`Unknown slot: "${record.momentoDelDia}" for date ${record.fecha}`);
          skipped++;
          continue;
        }

        // Create timestamp from date + time
        const dateObj = new Date(`${dateStr}T${record.hora}:00`);
        const recordedAt = dateObj.getTime();

        // Check for duplicates (same patient, date, slot, and value)
        const existingRecords = await ctx.db
          .query("glucoseRecords")
          .withIndex("by_patient_date", (q) =>
            q.eq("patientId", patientId).eq("date", dateStr)
          )
          .collect();

        const isDuplicate = existingRecords.some(
          (existing) =>
            existing.slot === slot && existing.value === record.valor
        );

        if (isDuplicate) {
          skipped++;
          continue;
        }

        // Insert the record
        await ctx.db.insert("glucoseRecords", {
          patientId,
          value: record.valor,
          date: dateStr,
          recordedAt,
          slot,
          updatedAt: Date.now(),
        });

        imported++;
      } catch (error) {
        errors.push(
          `Error processing record ${record.fecha} ${record.hora}: ${error}`
        );
        skipped++;
      }
    }

    return {
      imported,
      skipped,
      total: records.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
});
