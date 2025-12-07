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

  // Insert symptom log
  supabase.from("symptom_logs").insert({
    patient_id,
    symptom_type,
    value,
    date: new Date().toISOString().split("T")[0],
    source: "call",
  });

  const symptomName = symptom_type === "stress" ? "estrés/ansiedad" : "mareos";
  const valueText = value ? "sí" : "no";

  return Response.json({
    success: true,
    message: `Registrado: ${symptomName} = ${valueText}`,
  });
}
