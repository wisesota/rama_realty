import { commitBuyerSessionToken, createBuyerSessionTokenRotation } from "@/lib/buyer-session-server";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin } from "@/lib/supabase/auth";

const maximumBodyBytes = 8_192;

function errorResponse(error: string, status: number) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function clean(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("Cross-origin advisor requests are not allowed.", 403);
  if (Number(request.headers.get("content-length") ?? 0) > maximumBodyBytes) return errorResponse("The advisor request is too large.", 413);
  try {
    const limit = await consumeApiRateLimit({ request, scope: "agent-tool", maximumRequests: 8, windowMs: 60_000 });
    if (!limit.allowed) return errorResponse("Too many advisor requests. Try again in a minute.", 429);
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) return errorResponse("Advisor handoff is temporarily unavailable.", 503);
    throw error;
  }

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("The request body must be valid JSON.", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("An advisor request is required.", 400);
  const candidate = body as Record<string, unknown>;
  const fullName = clean(candidate.fullName, 120);
  const email = clean(candidate.email, 254).toLowerCase();
  const phone = clean(candidate.phone, 40);
  const message = clean(candidate.message, 1_000);
  const propertyId = clean(candidate.propertyId, 200);
  const searchRunId = clean(candidate.searchRunId, 64);
  const idempotencyKey = clean(request.headers.get("idempotency-key"), 128);
  if (candidate.consent !== true) return errorResponse("Consent is required before Rama can share contact details.", 400);
  if (fullName.length < 2 || !propertyId || !/^[0-9a-f-]{36}$/i.test(searchRunId)) return errorResponse("Complete the required advisor-request fields.", 400);
  if (!email && !phone) return errorResponse("Provide an email address or phone number for the advisor.", 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errorResponse("Enter a valid email address.", 400);
  if (idempotencyKey.length < 16) return errorResponse("A valid idempotency key is required.", 400);

  const correlationId = crypto.randomUUID();
  const admin = createAdminClient();
  const rotation = await createBuyerSessionTokenRotation(`handoff:${idempotencyKey}`);
  const { data, error } = await admin.rpc("create_buyer_inquiry", {
    p_token_hash: rotation.currentTokenHash,
    p_next_token_hash: rotation.nextTokenHash,
    p_search_run_id: searchRunId,
    p_property_id: propertyId,
    p_full_name: fullName,
    p_email: email,
    p_phone: phone,
    p_message: message,
    p_consent_purpose: "Advisor follow-up about the selected Rama property and buyer brief",
    p_policy_version: "buyer-handoff-v1",
    p_destination: "Rama CRM",
    p_idempotency_key: idempotencyKey,
    p_correlation_id: correlationId,
  });
  if (error || typeof data !== "string") {
    console.error("Buyer inquiry creation failed:", error?.code ?? "InvalidResult");
    return errorResponse("The advisor request could not be saved. Your contact details were not shared.", 503);
  }
  await commitBuyerSessionToken(rotation.nextToken);
  return Response.json({ inquiryId: data, correlationId }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
