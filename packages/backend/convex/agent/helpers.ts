import { z } from "zod";
import { AgentResponse } from "./types";

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
// Request Parsing & Validation
// ============================================

/**
 * Parses and validates a request body using a Zod schema
 * Returns either validated data or an error response
 */
export async function parseAndValidate<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<
  | { success: true; data: T }
  | { success: false; response: Response }
> {
  let body: unknown;

  // Parse JSON body
  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      response: errorResponse("Invalid JSON body"),
    };
  }

  // Validate with Zod schema
  const result = schema.safeParse(body);

  if (!result.success) {
    // Log validation error for debugging
    console.error("[Validation Error]", {
      body,
      error: result.error.issues,
    });

    // Get first error message from Zod error
    const firstError = result.error.issues?.[0];
    const message = firstError?.message || "Datos de entrada inválidos";

    return {
      success: false,
      response: errorResponse(message),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
