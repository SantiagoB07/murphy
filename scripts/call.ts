import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const PATIENT_ID = "8a35de65-996a-487b-8dcd-0b643ed22a91";
const TO_NUMBER = "+573012052395";

async function makeCall() {
  console.log("Enviando request con:");
  console.log("- agent_id:", process.env.ELEVENLABS_AGENT_ID);
  console.log("- agent_phone_number_id:", process.env.ELEVENLABS_PHONE_NUMBER_ID);
  console.log("- to_number:", TO_NUMBER);
  console.log("- patient_id:", PATIENT_ID);

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
        to_number: TO_NUMBER,
        conversation_initiation_client_data: {
          dynamic_variables: {
            patient_id: PATIENT_ID,
          },
        },
      }),
    }
  );

  const data = await response.json();
  console.log("Llamada iniciada:", data);
}

makeCall();
