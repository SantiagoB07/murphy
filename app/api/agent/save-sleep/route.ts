import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("=== BODY RECIBIDO (sleep) ===");
    console.log(JSON.stringify(body, null, 2));

    // ElevenLabs puede enviar los datos anidados en diferentes estructuras
    const patient_id = body.patient_id || body.sleep_data?.patient_id;
    const hours = body.hours || body.sleep_data?.hours;

    if (!patient_id || !hours) {
      return NextResponse.json(
        { error: "patient_id y hours son requeridos" },
        { status: 400 }
      );
    }

    // Guardar horas de sueño en Supabase (sin await - respuesta inmediata)
    supabase
      .from("sleep_logs")
      .insert({
        patient_id,
        hours: parseFloat(hours),
        date: new Date().toISOString().split("T")[0],
        source: "call",
      })
      .then(({ error }) => {
        if (error) {
          console.error("Error guardando sueño:", error);
        } else {
          console.log("Sueño guardado exitosamente");
        }
      });

    // Respuesta inmediata para el agente de ElevenLabs
    return NextResponse.json({
      success: true,
      message: `Perfecto, registré que dormiste ${hours} horas`,
    });
  } catch (error) {
    console.error("Error en save-sleep:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
