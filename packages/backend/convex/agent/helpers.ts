import { AgentResponse, RequestBody } from "./types";

// ============================================
// HTTP Response Helpers
// ============================================

export function jsonResponse(data: AgentResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, message }, status);
}

export function successResponse(message: string): Response {
  return jsonResponse({ success: true, message });
}

// ============================================
// Request Parsing
// ============================================

export async function parseBody(request: Request): Promise<RequestBody | null> {
  try {
    return (await request.json()) as RequestBody;
  } catch {
    return null;
  }
}
