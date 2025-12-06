import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get patient_id from command line arguments
const PATIENT_ID = process.argv[2];
const TO_NUMBER = process.argv[3];

if (!PATIENT_ID) {
  console.error("❌ Uso: npx tsx scripts/call.ts <patient_id> [to_number]");
  console.error("   Ejemplo: npx tsx scripts/call.ts 8a35de65-996a-487b-8dcd-0b643ed22a91 +573115730455");
  process.exit(1);
}

// Helper: Format relative time (hace 2h, ayer, etc.)
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `hace ${diffMins} min`;
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`;
  } else if (diffDays === 1) {
    return "ayer";
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`;
  } else {
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  }
}

// Get patient info
async function getPatient(patientId: string) {
  const { data, error } = await supabase
    .from("patients")
    .select("name, age, diabetes_type, diagnosis_year, phone")
    .eq("id", patientId)
    .single();

  if (error) {
    console.error("Error fetching patient:", error);
    return null;
  }
  return data;
}

// Get last glucometries
async function getLastGlucometries(patientId: string, limit = 10) {
  const { data, error } = await supabase
    .from("glucometries")
    .select("value, measured_at")
    .eq("patient_id", patientId)
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching glucometries:", error);
    return [];
  }
  return data || [];
}

// Get last sleep logs
async function getLastSleepLogs(patientId: string, limit = 10) {
  const { data, error } = await supabase
    .from("sleep_logs")
    .select("hours, date")
    .eq("patient_id", patientId)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching sleep logs:", error);
    return [];
  }
  return data || [];
}

// Get last insulin doses
async function getLastInsulinDoses(patientId: string, limit = 10) {
  const { data, error } = await supabase
    .from("insulin_doses")
    .select("dose, unit, administered_at")
    .eq("patient_id", patientId)
    .order("administered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching insulin doses:", error);
    return [];
  }
  return data || [];
}

// Format glucometries for the agent
function formatGlucometries(glucometries: { value: number; measured_at: string }[]): string {
  if (glucometries.length === 0) return "Sin registros";

  return glucometries
    .map((g) => `${g.value} mg/dL (${formatRelativeTime(new Date(g.measured_at))})`)
    .join(", ");
}

// Format sleep logs for the agent
function formatSleepLogs(sleepLogs: { hours: number; date: string }[]): string {
  if (sleepLogs.length === 0) return "Sin registros";

  return sleepLogs
    .map((s) => `${s.hours} horas (${formatRelativeTime(new Date(s.date))})`)
    .join(", ");
}

// Format insulin doses for the agent
function formatInsulinDoses(insulinDoses: { dose: number; unit: string; administered_at: string }[]): string {
  if (insulinDoses.length === 0) return "Sin registros";

  return insulinDoses
    .map((i) => `${i.dose} ${i.unit || "UI"} (${formatRelativeTime(new Date(i.administered_at))})`)
    .join(", ");
}

async function makeCall() {
  console.log("📞 Preparando llamada...\n");

  // Fetch all patient data in parallel
  const [patient, glucometries, sleepLogs, insulinDoses] = await Promise.all([
    getPatient(PATIENT_ID),
    getLastGlucometries(PATIENT_ID),
    getLastSleepLogs(PATIENT_ID),
    getLastInsulinDoses(PATIENT_ID),
  ]);

  if (!patient) {
    console.error("❌ No se encontró el paciente con ID:", PATIENT_ID);
    process.exit(1);
  }

  // Use patient's phone if not provided
  const phoneNumber = TO_NUMBER || patient.phone;

  if (!phoneNumber) {
    console.error("❌ No se proporcionó número de teléfono y el paciente no tiene uno registrado");
    process.exit(1);
  }

  // Format data for the agent
  const dynamicVariables = {
    patient_id: PATIENT_ID,
    patient_name: patient.name || "Paciente",
    patient_age: String(patient.age || "desconocida"),
    diabetes_type: patient.diabetes_type || "no especificado",
    diagnosis_year: String(patient.diagnosis_year || "no especificado"),
    recent_glucometries: formatGlucometries(glucometries),
    recent_sleep: formatSleepLogs(sleepLogs),
    recent_insulin: formatInsulinDoses(insulinDoses),
  };

  console.log("👤 Paciente:", patient.name);
  console.log("📱 Teléfono:", phoneNumber);
  console.log("\n📊 Contexto a enviar al agente:");
  console.log("   - Edad:", dynamicVariables.patient_age, "años");
  console.log("   - Tipo de diabetes:", dynamicVariables.diabetes_type);
  console.log("   - Diagnosticado en:", dynamicVariables.diagnosis_year);
  console.log("   - Glucometrías:", glucometries.length, "registros");
  console.log("   - Sueño:", sleepLogs.length, "registros");
  console.log("   - Insulina:", insulinDoses.length, "registros");
  console.log("\n🚀 Iniciando llamada...\n");

  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: process.env.ELEVENLABS_AGENT_ID,
        agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
        to_number: phoneNumber,
        conversation_initiation_client_data: {
          dynamic_variables: dynamicVariables,
        },
      }),
    }
  );

  const data = await response.json();

  if (response.ok) {
    console.log("✅ Llamada iniciada exitosamente");
    console.log("   Call ID:", data.call_id || data.id);
  } else {
    console.error("❌ Error al iniciar llamada:", data);
  }
}

makeCall();
