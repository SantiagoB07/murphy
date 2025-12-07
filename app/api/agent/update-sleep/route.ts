import { updateSleep } from "@/app/lib/tools/sleep";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (update-sleep) ===");
    console.log(JSON.stringify(body, null, 2));

    const patient_id = body.patient_id || body.sleep_data?.patient_id;
    const hours = body.hours || body.sleep_data?.hours;

    if (!patient_id || !hours) {
      return Response.json(
        { error: "patient_id y hours son requeridos" },
        { status: 400 }
      );
    }

    // Update necesita await para obtener el registro previo, pero el update es fire-and-forget
    const result = await updateSleep(patient_id, parseFloat(hours), false);

    return Response.json(result);
  } catch (error) {
    console.error("Error en update-sleep:", error);
    return Response.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
