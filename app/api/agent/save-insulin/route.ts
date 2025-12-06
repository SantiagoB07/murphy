import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (insulin) ===");
    console.log(JSON.stringify(body, null, 2));

    // ElevenLabs puede enviar los datos anidados en diferentes estructuras
    const patient_id = body.patient_id || body.insulin_data?.patient_id;
    const dose = body.dose || body.insulin_data?.dose;

    if (!patient_id || !dose) {
      return NextResponse.json(
        { error: "patient_id y dose son requeridos" },
        { status: 400 }
      );
    }

    // Guardar dosis de insulina en Supabase (sin await - respuesta inmediata)
    supabase
      .from("insulin_doses")
      .insert({
        patient_id,
        dose: parseFloat(dose),
        unit: "units",
        scheduled_time: new Date().toTimeString().split(" ")[0],
        administered_at: new Date().toISOString(),
        source: "call",
      })
      .then(({ error }) => {
        if (error) {
          console.error("Error guardando insulina:", error);
        } else {
          console.log("Insulina guardada exitosamente");
        }
      });

    // Respuesta inmediata para el agente de ElevenLabs
    return NextResponse.json({
      success: true,
      message: `Perfecto, registré tu dosis de ${dose} unidades de insulina`,
    });
  } catch (error) {
    console.error("Error en save-insulin:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
