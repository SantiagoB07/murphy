import { updateSymptom, isValidSymptomType, type SymptomType } from "@/app/lib/tools/symptom";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (update-symptom) ===");
    console.log(JSON.stringify(body, null, 2));

    const patient_id = body.patient_id || body.symptom_data?.patient_id;
    const symptom_type = body.symptom_type || body.symptom_data?.symptom_type;
    const value = body.value ?? body.symptom_data?.value;

    if (!patient_id || !symptom_type || value === undefined) {
      return Response.json(
        { error: "patient_id, symptom_type y value son requeridos" },
        { status: 400 }
      );
    }

    // Validar symptom_type
    if (!isValidSymptomType(symptom_type)) {
      return Response.json({
        success: false,
        message: `Tipo de síntoma no válido. Usa: stress, dizziness`,
      });
    }

    // Await response to ensure data is saved in Edge Runtime
    const result = await updateSymptom(
      patient_id,
      symptom_type as SymptomType,
      Boolean(value),
      true
    );

    return Response.json(result);
  } catch (error) {
    console.error("Error en update-symptom:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
