import "server-only";

import { createHmac } from "node:crypto";
import { buildRateLimitBucketKey, type RateLimitScope } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  backend: "supabase" | "memory";
};

type MemoryBucket = {
  count: number;
  resetAt: number;
};

const developmentBuckets = new Map<string, MemoryBucket>();

export class RateLimitBackendUnavailableError extends Error {
  constructor() {
    super("The shared rate-limit service is unavailable.");
    this.name = "RateLimitBackendUnavailableError";
  }
}

function getRateLimitSecret() {
  return process.env.RATE_LIMIT_SECRET || "";
}

function rateLimitBucketKey({
  request,
  scope,
  bucket,
}: {
  request: Request;
  scope: RateLimitScope;
  bucket?: "request" | "global";
}) {
  const secret = getRateLimitSecret();
  return secret
    ? bucket === "global"
      ? createHmac("sha256", secret).update(`${scope}\nglobal`).digest("hex")
      : buildRateLimitBucketKey(request, scope, secret)
    : "anonymous";
}

function consumeDevelopmentBucket(
  key: string,
  maximumRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = developmentBuckets.get(key);
  const bucket =
    !existing || existing.resetAt <= now
      ? { count: 1, resetAt: now + windowMs }
      : { count: existing.count + 1, resetAt: existing.resetAt };

  developmentBuckets.set(key, bucket);
  return {
    allowed: bucket.count <= maximumRequests,
    remaining: Math.max(0, maximumRequests - bucket.count),
    resetAt: new Date(bucket.resetAt).toISOString(),
    backend: "memory",
  };
}

export async function consumeApiRateLimit(options: {
  request: Request;
  scope: RateLimitScope;
  maximumRequests: number;
  windowMs: number;
  bucket?: "request" | "global";
}): Promise<RateLimitResult> {
  const bucketKey = rateLimitBucketKey(options);
  const memoryKey = `${options.scope}:${bucketKey}`;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("consume_api_rate_limit", {
      p_scope: options.scope,
      p_bucket_key: bucketKey,
      p_window_seconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
      p_max_requests: options.maximumRequests,
    });

    const result = data?.[0];
    if (
      error ||
      !result ||
      typeof result.allowed !== "boolean" ||
      typeof result.remaining !== "number" ||
      typeof result.reset_at !== "string"
    ) {
      throw new RateLimitBackendUnavailableError();
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.reset_at,
      backend: "supabase",
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      if (error instanceof RateLimitBackendUnavailableError) throw error;
      throw new RateLimitBackendUnavailableError();
    }
    return consumeDevelopmentBucket(
      memoryKey,
      options.maximumRequests,
      options.windowMs,
    );
  }
}

export async function releaseApiRateLimit(options: {
  request: Request;
  scope: RateLimitScope;
  resetAt: string;
  bucket?: "request" | "global";
}) {
  const bucketKey = rateLimitBucketKey(options);
  const memoryKey = `${options.scope}:${bucketKey}`;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc("release_api_rate_limit", {
      p_scope: options.scope,
      p_bucket_key: bucketKey,
      p_reset_at: options.resetAt,
    });
    if (error || typeof data !== "boolean") throw new RateLimitBackendUnavailableError();
    return data;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      if (error instanceof RateLimitBackendUnavailableError) throw error;
      throw new RateLimitBackendUnavailableError();
    }
    const bucket = developmentBuckets.get(memoryKey);
    if (!bucket || new Date(options.resetAt).getTime() !== bucket.resetAt || bucket.count <= 0) return false;
    bucket.count -= 1;
    return true;
  }
}
