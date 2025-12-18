import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PATIENT_ID = "22c92aba-bacc-4f29-ad00-aa5024c4c155";

// Genera fecha aleatoria entre hoy y hace 3 meses
function randomDate(): Date {
  const now = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const randomTime = threeMonthsAgo.getTime() + Math.random() * (now.getTime() - threeMonthsAgo.getTime());
  return new Date(randomTime);
}

// Genera hora específica para un momento del día
function setTimeOfDay(date: Date, slot: 'morning' | 'afternoon' | 'night'): Date {
  const d = new Date(date);
  if (slot === 'morning') {
    d.setHours(7, 30, 0, 0);  // 07:30 - antes del desayuno
  } else if (slot === 'afternoon') {
    d.setHours(13, 0, 0, 0);  // 13:00 - después del almuerzo
  } else {
    d.setHours(21, 0, 0, 0);  // 21:00 - noche
  }
  return d;
}

async function seedData() {
  console.log("Seeding data for patient:", PATIENT_ID);

  // 1. Glucometries - 3 registros en diferentes horarios
  const glucometries = [
    {
      patient_id: PATIENT_ID,
      value: 95,  // Normal en ayunas
      scheduled_time: "07:30:00",
      measured_at: setTimeOfDay(randomDate(), 'morning').toISOString(),
      source: "seed"
    },
    {
      patient_id: PATIENT_ID,
      value: 145, // Normal postprandial
      scheduled_time: "13:00:00",
      measured_at: setTimeOfDay(randomDate(), 'afternoon').toISOString(),
      source: "seed"
    },
    {
      patient_id: PATIENT_ID,
      value: 120, // Normal nocturno
      scheduled_time: "21:00:00",
      measured_at: setTimeOfDay(randomDate(), 'night').toISOString(),
      source: "seed"
    }
  ];

  console.log("\n=== Inserting Glucometries ===");
  const { data: glucData, error: glucError } = await supabase
    .from("glucometries")
    .insert(glucometries)
    .select();
  
  if (glucError) console.error("Error:", glucError);
  else console.log("Inserted:", glucData);

  // 2. Insulin doses - 3 registros
  const insulinDoses = [
    {
      patient_id: PATIENT_ID,
      dose: 8,
      unit: "units",
      scheduled_time: "07:30:00",
      administered_at: setTimeOfDay(randomDate(), 'morning').toISOString(),
      source: "seed"
    },
    {
      patient_id: PATIENT_ID,
      dose: 10,
      unit: "units",
      scheduled_time: "13:00:00",
      administered_at: setTimeOfDay(randomDate(), 'afternoon').toISOString(),
      source: "seed"
    },
    {
      patient_id: PATIENT_ID,
      dose: 12,
      unit: "units",
      scheduled_time: "21:00:00",
      administered_at: setTimeOfDay(randomDate(), 'night').toISOString(),
      source: "seed"
    }
  ];

  console.log("\n=== Inserting Insulin Doses ===");
  const { data: insulinData, error: insulinError } = await supabase
    .from("insulin_doses")
    .insert(insulinDoses)
    .select();
  
  if (insulinError) console.error("Error:", insulinError);
  else console.log("Inserted:", insulinData);

  // 3. Sleep logs - varios registros (últimos días)
  const sleepLogs = [];
  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i * 9); // Distribuir en 3 meses
    sleepLogs.push({
      patient_id: PATIENT_ID,
      hours: 6 + Math.random() * 3, // Entre 6 y 9 horas
      date: date.toISOString().split('T')[0],
      source: "seed"
    });
  }

  console.log("\n=== Inserting Sleep Logs ===");
  const { data: sleepData, error: sleepError } = await supabase
    .from("sleep_logs")
    .insert(sleepLogs)
    .select();
  
  if (sleepError) console.error("Error:", sleepError);
  else console.log("Inserted:", sleepData);

  console.log("\n=== Done! ===");
}

seedData();
