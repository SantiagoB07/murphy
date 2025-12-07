import { saveGlucometry } from "@/app/lib/tools/glucometry";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (save-glucometry) ===");
    console.log(JSON.stringify(body, null, 2));

    const patient_id = body.patient_id || body.glucometry_data?.patient_id;
    const value = body.value || body.glucometry_data?.value;

    if (!patient_id || !value) {
      return Response.json(
        { error: "patient_id y value son requeridos" },
        { status: 400 }
      );
    }

    // Fire-and-forget para llamadas (awaitResponse = false)
    const result = await saveGlucometry(patient_id, parseFloat(value), "call", false);

    return Response.json(result);
  } catch (error) {
    console.error("Error en save-glucometry:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
