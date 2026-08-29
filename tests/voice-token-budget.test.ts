import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createToken: vi.fn(),
  consumeApiRateLimit: vi.fn(),
}));

vi.mock("@google/genai", () => ({
  EndSensitivity: { END_SENSITIVITY_LOW: "low" },
  Modality: { AUDIO: "audio" },
  StartSensitivity: { START_SENSITIVITY_HIGH: "high" },
  ThinkingLevel: { LOW: "low" },
  GoogleGenAI: class {
    authTokens = { create: mocks.createToken };
  },
}));
vi.mock("@/lib/rate-limit-server", () => ({
  consumeApiRateLimit: mocks.consumeApiRateLimit,
  RateLimitBackendUnavailableError: class RateLimitBackendUnavailableError extends Error {},
}));
vi.mock("@/lib/supabase/auth", () => ({ isSameOrigin: () => true }));
vi.mock("@/lib/buyer-session-server", () => ({
  getOrCreateBuyerSessionTokenHash: () => Promise.resolve("buyer-hash"),
}));
vi.mock("@/lib/rollout-server", () => ({
  decisionOsEnabledForBuyer: () => true,
  publicExperienceEnabled: () => true,
}));

import { POST } from "@/app/api/voice/token/route";

function request() {
  return new Request("https://rama.example/api/voice/token", {
    method: "POST",
    headers: { origin: "https://rama.example", "content-type": "application/json" },
    body: "{}",
  });
}

beforeEach(() => {
  vi.stubEnv("GEMINI_API_KEY", "test-api-key");
  vi.stubEnv("GEMINI_LIVE_ENABLED", "true");
  mocks.consumeApiRateLimit.mockReset().mockResolvedValue({ allowed: true });
  mocks.createToken.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Gemini Live daily capacity", () => {
  it("does not consume daily capacity when token issuance fails", async () => {
    mocks.createToken.mockRejectedValue(new Error("provider unavailable"));

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(mocks.consumeApiRateLimit).toHaveBeenCalledTimes(1);
    expect(mocks.consumeApiRateLimit).not.toHaveBeenCalledWith(expect.objectContaining({
      scope: "gemini-live-daily",
    }));
  });

  it("atomically consumes daily capacity before returning an issued token", async () => {
    mocks.createToken.mockResolvedValue({ name: "ephemeral-token" });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(mocks.consumeApiRateLimit).toHaveBeenNthCalledWith(2, expect.objectContaining({
      scope: "gemini-live-daily",
      bucket: "global",
    }));
  });
});
