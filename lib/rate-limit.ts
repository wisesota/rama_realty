import { createHmac } from "node:crypto";

export const rateLimitScopes = [
  "gemini-live-token",
  "gemini-voice-turn",
  "agent-tool",
  "property-search",
  "prepare-brief",
  "decision-ledger",
  "buyer-deletion-verification",
] as const;

export type RateLimitScope = (typeof rateLimitScopes)[number];

function firstHeaderAddress(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

export function getRequestAddress(request: Request) {
  const address =
    firstHeaderAddress(request.headers.get("x-vercel-forwarded-for")) ||
    firstHeaderAddress(request.headers.get("cf-connecting-ip")) ||
    firstHeaderAddress(request.headers.get("x-real-ip")) ||
    firstHeaderAddress(request.headers.get("x-forwarded-for"));

  return address.slice(0, 128) || "unknown";
}

export function buildRateLimitBucketKey(
  request: Request,
  scope: RateLimitScope,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`${scope}\n${getRequestAddress(request)}`)
    .digest("hex");
}
