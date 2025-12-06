import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: Request) {
  const { patient_id, dose, unit } = await request.json();

  // 1. Find the most recent insulin record
  const { data: latest, error: findError } = await supabase
    .from("insulin_doses")
    .select("id, dose, unit")
    .eq("patient_id", patient_id)
    .order("administered_at", { ascending: false })
    .limit(1)
    .single();

  if (findError || !latest) {
    return Response.json({
      success: false,
      message: "No hay registros de insulina para actualizar",
    });
  }

  const oldDose = latest.dose;
  const oldUnit = latest.unit || "UI";

  // 2. Update the record
  const updateData: { dose: number; unit?: string } = { dose };
  if (unit) {
    updateData.unit = unit;
  }

  const { error: updateError } = await supabase
    .from("insulin_doses")
    .update(updateData)
    .eq("id", latest.id);

  if (updateError) {
    return Response.json({
      success: false,
      message: "Error al actualizar la dosis de insulina",
    });
  }

  return Response.json({
    success: true,
    message: `Insulina actualizada de ${oldDose} ${oldUnit} a ${dose} ${unit || oldUnit}`,
  });
}
