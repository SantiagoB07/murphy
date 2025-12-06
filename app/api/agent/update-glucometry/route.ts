import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: Request) {
  const { patient_id, value } = await request.json();

  // 1. Find the most recent glucometry record
  const { data: latest, error: findError } = await supabase
    .from("glucometries")
    .select("id, value")
    .eq("patient_id", patient_id)
    .order("measured_at", { ascending: false })
    .limit(1)
    .single();

  if (findError || !latest) {
    return Response.json({
      success: false,
      message: "No hay registros de glucosa para actualizar",
    });
  }

  const oldValue = latest.value;

  // 2. Update the record
  const { error: updateError } = await supabase
    .from("glucometries")
    .update({ value })
    .eq("id", latest.id);

  if (updateError) {
    return Response.json({
      success: false,
      message: "Error al actualizar la glucosa",
    });
  }

  return Response.json({
    success: true,
    message: `Glucosa actualizada de ${oldValue} a ${value} mg/dL`,
  });
}
