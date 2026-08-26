import { getOrCreateBuyerSessionTokenHash } from "@/lib/buyer-session-server";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin } from "@/lib/supabase/auth";
import { decisionOsEnabledForBuyer, evidenceV2WriterEnabled, publicExperienceEnabled } from "@/lib/rollout-server";

const eventTypes = ["criterion_revised", "candidate_dismissed", "open_question"] as const;

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("Cross-origin ledger requests are not allowed.", 403);
  if (!publicExperienceEnabled() || !evidenceV2WriterEnabled()) return errorResponse("Decision Ledger updates are temporarily unavailable.", 503);
  if (Number(request.headers.get("content-length") ?? 0) > 4_096) return errorResponse("The ledger request is too large.", 413);
  try {
    const limit = await consumeApiRateLimit({ request, scope: "decision-ledger", maximumRequests: 60, windowMs: 60_000 });
    if (!limit.allowed) return errorResponse("Too many ledger updates. Try again in a minute.", 429);
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) return errorResponse("Decision Ledger updates are temporarily unavailable.", 503);
    throw error;
  }
  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("The request body must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("A ledger event is required.", 400);
  const { searchRunId, eventType, propertyId, summary, idempotencyKey } = body as Record<string, unknown>;
  if (typeof searchRunId !== "string" || !eventTypes.includes(eventType as (typeof eventTypes)[number])
    || (propertyId !== null && propertyId !== undefined && typeof propertyId !== "string")
    || (eventType === "candidate_dismissed" && typeof propertyId !== "string")
    || typeof summary !== "string" || summary.trim().length < 1 || summary.length > 500
    || typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
    return errorResponse("The ledger event is invalid.", 400);
  }
  const buyerTokenHash = await getOrCreateBuyerSessionTokenHash();
  if (!decisionOsEnabledForBuyer(buyerTokenHash)) return errorResponse("Decision Ledger updates are temporarily unavailable.", 503);
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("append_buyer_ledger_event", {
    p_token_hash: buyerTokenHash,
    p_search_run_id: searchRunId,
    p_event_type: eventType as (typeof eventTypes)[number],
    p_summary: summary.trim(),
    p_property_id: typeof propertyId === "string" ? propertyId : null,
    p_idempotency_key: idempotencyKey,
  });
  if (error || typeof data !== "string") return errorResponse("The Decision Ledger could not be updated.", 503);
  return Response.json({ eventId: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
