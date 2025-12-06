import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // DEBUG: Ver qué está enviando ElevenLabs
    console.log("=== BODY RECIBIDO ===");
    console.log(JSON.stringify(body, null, 2));

    // ElevenLabs puede enviar los datos anidados en diferentes estructuras
    const patient_id = body.patient_id || body.glucometry_data?.patient_id;
    const value = body.value || body.glucometry_data?.value;

    if (!patient_id || !value) {
      return NextResponse.json(
        { error: "patient_id y value son requeridos" },
        { status: 400 }
      );
    }

    // Guardar glucometría en Supabase (sin await - respuesta inmediata)
    supabase
      .from("glucometries")
      .insert({
        patient_id,
        value: parseFloat(value),
        scheduled_time: new Date().toTimeString().split(" ")[0],
        measured_at: new Date().toISOString(),
        source: "call",
      })
      .then(({ error }) => {
        if (error) {
          console.error("Error guardando glucometría:", error);
        } else {
          console.log("Glucometría guardada exitosamente");
        }
      });

    // Respuesta inmediata para el agente de ElevenLabs
    return NextResponse.json({
      success: true,
      message: `Perfecto, registré tu glucosa en ${value} mg/dL`,
    });
  } catch (error) {
    console.error("Error en save-glucometry:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
