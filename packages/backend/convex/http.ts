import { httpRouter } from "convex/server";
import { httpSaveGlucometry, httpUpdateGlucometry } from "./agent/httpGlucometry";
import { httpSaveInsulin, httpUpdateInsulin } from "./agent/httpInsulin";
import { httpSaveSleep, httpUpdateSleep } from "./agent/httpSleep";
import { httpSaveStress, httpUpdateStress } from "./agent/httpStress";
import { httpSaveDizziness, httpUpdateDizziness } from "./agent/httpDizziness";
import { httpElevenLabsWebhook } from "./agent/webhooks";
import { httpKapsoWebhook } from "./kapso/webhook";

const http = httpRouter();

// ============================================
// Agent Tools - Glucometry
// ============================================

http.route({
  path: "/api/agent/save-glucometry",
  method: "POST",
  handler: httpSaveGlucometry,
});

http.route({
  path: "/api/agent/update-glucometry",
  method: "POST",
  handler: httpUpdateGlucometry,
});

// ============================================
// Agent Tools - Insulin
// ============================================

http.route({
  path: "/api/agent/save-insulin",
  method: "POST",
  handler: httpSaveInsulin,
});

http.route({
  path: "/api/agent/update-insulin",
  method: "POST",
  handler: httpUpdateInsulin,
});

// ============================================
// Agent Tools - Sleep
// ============================================

http.route({
  path: "/api/agent/save-sleep",
  method: "POST",
  handler: httpSaveSleep,
});

http.route({
  path: "/api/agent/update-sleep",
  method: "POST",
  handler: httpUpdateSleep,
});

// ============================================
// Agent Tools - Stress
// ============================================

http.route({
  path: "/api/agent/save-stress",
  method: "POST",
  handler: httpSaveStress,
});

http.route({
  path: "/api/agent/update-stress",
  method: "POST",
  handler: httpUpdateStress,
});

// ============================================
// Agent Tools - Dizziness
// ============================================

http.route({
  path: "/api/agent/save-dizziness",
  method: "POST",
  handler: httpSaveDizziness,
});

http.route({
  path: "/api/agent/update-dizziness",
  method: "POST",
  handler: httpUpdateDizziness,
});

// ============================================
// ElevenLabs Webhooks
// ============================================

http.route({
  path: "/api/agent/webhook/elevenlabs",
  method: "POST",
  handler: httpElevenLabsWebhook,
});


// ============================================
// Kapso Webhooks 
// ============================================


http.route({
  path: "/api/webhooks/kapso",
  method: "POST",
  handler: httpKapsoWebhook
})




// Convex expects the router to be the default export
export default http;
