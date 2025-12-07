import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: Request) {
  const { patient_id, symptom_type, value } = await request.json();

  // Validate symptom_type
  const validSymptoms = ["stress", "dizziness"];
  if (!validSymptoms.includes(symptom_type)) {
    return Response.json({
      success: false,
      message: `Tipo de síntoma no válido. Usa: ${validSymptoms.join(", ")}`,
    });
  }

  // 1. Find the most recent symptom record of this type
  const { data: latest, error: findError } = await supabase
    .from("symptom_logs")
    .select("id, value")
    .eq("patient_id", patient_id)
    .eq("symptom_type", symptom_type)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (findError || !latest) {
    const symptomName = symptom_type === "stress" ? "estrés/ansiedad" : "mareos";
    return Response.json({
      success: false,
      message: `No hay registros de ${symptomName} para actualizar`,
    });
  }

  const oldValue = latest.value;

  // 2. Update the record
  const { error: updateError } = await supabase
    .from("symptom_logs")
    .update({ value })
    .eq("id", latest.id);

  if (updateError) {
    return Response.json({
      success: false,
      message: "Error al actualizar el síntoma",
    });
  }

  const symptomName = symptom_type === "stress" ? "estrés/ansiedad" : "mareos";
  const oldText = oldValue ? "sí" : "no";
  const newText = value ? "sí" : "no";

  return Response.json({
    success: true,
    message: `${symptomName} actualizado de ${oldText} a ${newText}`,
  });
}
