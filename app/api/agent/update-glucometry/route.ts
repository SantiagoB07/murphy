import { updateGlucometry } from "@/app/lib/tools/glucometry";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (update-glucometry) ===");
    console.log(JSON.stringify(body, null, 2));

    const patient_id = body.patient_id || body.glucometry_data?.patient_id;
    const value = body.value || body.glucometry_data?.value;

    if (!patient_id || !value) {
      return Response.json(
        { error: "patient_id y value son requeridos" },
        { status: 400 }
      );
    }

    // Update necesita await para obtener el registro previo, pero el update es fire-and-forget
    const result = await updateGlucometry(patient_id, parseFloat(value), false);

    return Response.json(result);
  } catch (error) {
    console.error("Error en update-glucometry:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
