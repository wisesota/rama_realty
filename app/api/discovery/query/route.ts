import { getOrCreateBuyerSessionTokenHash } from "@/lib/buyer-session-server";
import { CatalogUnavailableError } from "@/lib/public-catalog-repository";
import { discoverProperties, PersistenceUnavailableError } from "@/lib/discovery-service";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { isSameOrigin } from "@/lib/supabase/auth";
import { briefConfirmationEnabled, decisionOsEnabledForBuyer } from "@/lib/rollout-server";

const maximumBriefLength = 500;
const maximumBodyBytes = 4096;

function errorResponse(error: string, status: number, code: string) {
  return Response.json({ error, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("Cross-origin discovery requests are not allowed.", 403, "OriginDenied");
  if (!briefConfirmationEnabled()) return errorResponse("Brief confirmation is temporarily unavailable.", 503, "BriefConfirmationDisabled");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maximumBodyBytes) return errorResponse("The property request is too large.", 413, "RequestTooLarge");
  try {
    const limit = await consumeApiRateLimit({ request, scope: "property-search", maximumRequests: 40, windowMs: 60_000 });
    if (!limit.allowed) return errorResponse("Too many property searches. Try again in a minute.", 429, "RateLimited");
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) return errorResponse("Property search is temporarily unavailable.", 503, "RateLimitUnavailable");
    throw error;
  }

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("The request body must be valid JSON.", 400, "InvalidJson"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("A property brief is required.", 400, "InvalidBrief");
  const { brief, source, idempotencyKey } = body as { brief?: unknown; source?: unknown; idempotencyKey?: unknown };
  if (typeof brief !== "string" || brief.trim().length < 3) return errorResponse("Describe the Dubai property or investment outcome you want.", 400, "InvalidBrief");
  if (brief.length > maximumBriefLength) return errorResponse(`Keep the property brief under ${maximumBriefLength} characters.`, 400, "InvalidBrief");
  if (source !== "text" && source !== "voice") return errorResponse("The search source must be text or voice.", 400, "InvalidSource");
  if (typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 128) return errorResponse("A valid confirmation key is required.", 400, "InvalidConfirmation");

  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 12_000);
  try {
    const buyerTokenHash = await getOrCreateBuyerSessionTokenHash();
    if (!decisionOsEnabledForBuyer(buyerTokenHash)) {
      return errorResponse("The Decision Room is temporarily unavailable for this rollout cohort.", 503, "DecisionOsDisabled");
    }
    const envelope = await discoverProperties({
      brief: brief.trim(),
      source,
      idempotencyKey,
      context: {
        correlationId: crypto.randomUUID(),
        buyerTokenHash,
        deadline: Date.now() + 12_000,
        signal: abort.signal,
      },
    });
    return Response.json(envelope, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof CatalogUnavailableError) return errorResponse(error.message, 503, "CatalogUnavailable");
    if (error instanceof PersistenceUnavailableError) return errorResponse(error.message, 503, "PersistenceUnavailable");
    if (error instanceof DOMException && error.name === "AbortError") return errorResponse("The property search timed out. Your brief is preserved.", 504, "DiscoveryTimeout");
    console.error("Discovery query failed:", error instanceof Error ? error.name : "UnknownError");
    return errorResponse("Property discovery is temporarily unavailable.", 503, "DiscoveryUnavailable");
  } finally {
    clearTimeout(timer);
  }
}
