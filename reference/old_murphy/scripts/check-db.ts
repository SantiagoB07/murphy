import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkDB() {
  console.log("=== PATIENTS ===");
  const { data: patients, error: pErr } = await supabase
    .from("patients")
    .select("id, name, phone")
    .limit(5);
  
  if (pErr) console.error("Error patients:", pErr);
  else console.log(JSON.stringify(patients, null, 2));

  console.log("\n=== ALERTS ===");
  const { data: alerts, error: aErr } = await supabase
    .from("alerts")
    .select("*")
    .limit(10);
  
  if (aErr) console.error("Error alerts:", aErr);
  else console.log(JSON.stringify(alerts, null, 2));

  console.log("\n=== GLUCOMETRIES (últimas 3) ===");
  const { data: glucs, error: gErr } = await supabase
    .from("glucometries")
    .select("patient_id, value, measured_at")
    .order("measured_at", { ascending: false })
    .limit(3);
  
  if (gErr) console.error("Error glucometries:", gErr);
  else console.log(JSON.stringify(glucs, null, 2));
}

checkDB();
