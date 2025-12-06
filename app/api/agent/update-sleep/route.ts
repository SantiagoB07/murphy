import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: Request) {
  const { patient_id, hours } = await request.json();

  // 1. Find the most recent sleep record
  const { data: latest, error: findError } = await supabase
    .from("sleep_logs")
    .select("id, hours")
    .eq("patient_id", patient_id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (findError || !latest) {
    return Response.json({
      success: false,
      message: "No hay registros de sueño para actualizar",
    });
  }

  const oldHours = latest.hours;

  // 2. Update the record
  const { error: updateError } = await supabase
    .from("sleep_logs")
    .update({ hours })
    .eq("id", latest.id);

  if (updateError) {
    return Response.json({
      success: false,
      message: "Error al actualizar las horas de sueño",
    });
  }

  return Response.json({
    success: true,
    message: `Horas de sueño actualizadas de ${oldHours} a ${hours} horas`,
  });
}
