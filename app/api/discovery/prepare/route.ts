import { prepareBriefDraft } from "@/lib/brief-confirmation";
import { consumeApiRateLimit, RateLimitBackendUnavailableError } from "@/lib/rate-limit-server";
import { isSameOrigin } from "@/lib/supabase/auth";
import { briefConfirmationEnabled, publicExperienceEnabled } from "@/lib/rollout-server";

const maximumBodyBytes = 4_096;

function errorResponse(error: string, status: number, code: string) {
  return Response.json({ error, code }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("Cross-origin brief requests are not allowed.", 403, "OriginDenied");
  if (!publicExperienceEnabled()) return errorResponse("The public discovery experience is temporarily unavailable.", 503, "PublicExperienceDisabled");
  if (!briefConfirmationEnabled()) return errorResponse("Brief confirmation is temporarily unavailable.", 503, "BriefConfirmationDisabled");
  if (Number(request.headers.get("content-length") ?? 0) > maximumBodyBytes) {
    return errorResponse("The brief request is too large.", 413, "RequestTooLarge");
  }
  try {
    const limit = await consumeApiRateLimit({ request, scope: "prepare-brief", maximumRequests: 60, windowMs: 60_000 });
    if (!limit.allowed) return errorResponse("Too many brief requests. Try again in a minute.", 429, "RateLimited");
  } catch (error) {
    if (error instanceof RateLimitBackendUnavailableError) return errorResponse("Brief preparation is temporarily unavailable.", 503, "RateLimitUnavailable");
    throw error;
  }

  let body: unknown;
  try { body = await request.json(); } catch { return errorResponse("The request body must be valid JSON.", 400, "InvalidJson"); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return errorResponse("A brief is required.", 400, "InvalidRequest");
  const { brief, source, draftId } = body as { brief?: unknown; source?: unknown; draftId?: unknown };
  if (typeof brief !== "string" || brief.length > 500 || (source !== "text" && source !== "voice") || (draftId !== undefined && typeof draftId !== "string")) {
    return errorResponse("A valid brief and source are required.", 400, "InvalidRequest");
  }
  try {
    return Response.json(prepareBriefDraft({ brief, source, draftId }), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "The brief could not be prepared.", 400, "InvalidBrief");
  }
}
