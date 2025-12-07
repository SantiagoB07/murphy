import { updateInsulin } from "@/app/lib/tools/insulin";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (update-insulin) ===");
    console.log(JSON.stringify(body, null, 2));

    const patient_id = body.patient_id || body.insulin_data?.patient_id;
    const dose = body.dose || body.insulin_data?.dose;

    if (!patient_id || !dose) {
      return Response.json(
        { error: "patient_id y dose son requeridos" },
        { status: 400 }
      );
    }

    // Update necesita await para obtener el registro previo, pero el update es fire-and-forget
    const result = await updateInsulin(patient_id, parseFloat(dose), false);

    return Response.json(result);
  } catch (error) {
    console.error("Error en update-insulin:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
