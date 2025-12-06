import "dotenv/config";

async function makeCall() {
  const response = await fetch(
    "https://api.elevenlabs.io/v1/convai/twilio/outbound_call",
    {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: process.env.ELEVENLABS_AGENT_ID,
        agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
        customer_phone_number: "+573012052395",
      }),
    }
  );

  const data = await response.json();
  console.log("Llamada iniciada:", data);
}

makeCall();
