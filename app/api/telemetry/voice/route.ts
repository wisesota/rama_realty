import { recordOperationalEvent } from "@/lib/operational-telemetry";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { isSameOrigin } from "@/lib/supabase/auth";
import { parseOperationalVoicePayload } from "@/lib/voice/operational-voice-contract";

const maximumBodyBytes = 2_048;

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (process.env.RAMA_OPERATIONAL_TELEMETRY_ENABLED !== "true") return new Response(null, { status: 204 });
  if (!isSameOrigin(request)) return jsonError("Cross-origin telemetry is not allowed.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return jsonError("Telemetry must use JSON.", 415);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > maximumBodyBytes) return jsonError("Telemetry payload is too large.", 413);

  try {
    const limit = await consumeApiRateLimit({ request, scope: "voice-telemetry", maximumRequests: 120, windowMs: 60_000 });
    if (!limit.allowed) return jsonError("Telemetry rate limit exceeded.", 429);
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) return jsonError("Telemetry is temporarily unavailable.", 503);
    throw error;
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > maximumBodyBytes) return jsonError("Telemetry payload is too large.", 413);
    body = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid telemetry payload.", 400);
  }
  const payload = parseOperationalVoicePayload(body);
  if (!payload) return jsonError("Invalid telemetry payload.", 400);
  recordOperationalEvent({ event: "voice.live_stage", ...payload });
  return new Response(null, { status: 204 });
}
