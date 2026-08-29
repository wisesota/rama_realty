import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));

import {
  consumeApiRateLimit,
  releaseApiRateLimit,
  RateLimitBackendUnavailableError,
} from "@/lib/rate-limit-server";

const request = new Request("https://rama.example/api/voice/token", {
  headers: { "x-vercel-forwarded-for": "203.0.113.18" },
});

beforeEach(() => {
  vi.stubEnv("RATE_LIMIT_SECRET", "rate-limit-test-secret-that-is-at-least-32-characters");
  mocks.rpc.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("server rate-limit backend policy", () => {
  it("fails closed in production when the shared limiter is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.rpc.mockRejectedValue(new Error("database unavailable"));

    await expect(consumeApiRateLimit({
      request,
      scope: "gemini-live-token",
      maximumRequests: 5,
      windowMs: 60_000,
    })).rejects.toBeInstanceOf(RateLimitBackendUnavailableError);
  });

  it("fails closed in production when the shared limiter returns malformed data", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(consumeApiRateLimit({
      request,
      scope: "gemini-live-token",
      maximumRequests: 5,
      windowMs: 60_000,
    })).rejects.toBeInstanceOf(RateLimitBackendUnavailableError);
  });

  it("uses a bounded process-local fallback outside production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.rpc.mockRejectedValue(new Error("local database unavailable"));

    const result = await consumeApiRateLimit({
      request,
      scope: "gemini-live-token",
      maximumRequests: 5,
      windowMs: 60_000,
    });

    expect(result).toMatchObject({ allowed: true, backend: "memory" });
  });

  it("uses one secret-derived global bucket for the daily provider budget", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.rpc.mockResolvedValue({
      data: [{ allowed: true, remaining: 499, reset_at: "2026-08-29T00:00:00Z" }],
      error: null,
    });

    await consumeApiRateLimit({
      request,
      scope: "gemini-live-daily",
      maximumRequests: 500,
      windowMs: 86_400_000,
      bucket: "global",
    });

    expect(mocks.rpc).toHaveBeenCalledWith("consume_api_rate_limit", expect.objectContaining({
      p_scope: "gemini-live-daily",
      p_max_requests: 500,
      p_window_seconds: 86_400,
      p_bucket_key: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });

  it("releases only the matching daily reservation window", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.rpc.mockResolvedValue({ data: true, error: null });

    await expect(releaseApiRateLimit({
      request,
      scope: "gemini-live-daily",
      resetAt: "2026-08-30T00:00:00Z",
      bucket: "global",
    })).resolves.toBe(true);

    expect(mocks.rpc).toHaveBeenCalledWith("release_api_rate_limit", expect.objectContaining({
      p_scope: "gemini-live-daily",
      p_reset_at: "2026-08-30T00:00:00Z",
      p_bucket_key: expect.stringMatching(/^[a-f0-9]{64}$/),
    }));
  });
});
