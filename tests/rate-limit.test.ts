import { describe, expect, it } from "vitest";
import {
  buildRateLimitBucketKey,
  getRequestAddress,
} from "@/lib/rate-limit";

describe("shared Gemini rate-limit identity", () => {
  it("prefers a platform-owned forwarding header when one is available", () => {
    const request = new Request("https://rama.example/api/voice/token", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.8",
        "x-forwarded-for": "198.51.100.4, 10.0.0.1",
      },
    });

    expect(getRequestAddress(request)).toBe("203.0.113.8");
  });

  it("creates stable opaque keys without retaining the raw address", () => {
    const request = new Request("https://rama.example/api/voice/token", {
      headers: {
        "x-forwarded-for": "198.51.100.4",
        "user-agent": "Rama test browser",
      },
    });

    const first = buildRateLimitBucketKey(request, "gemini-live-token", "test-secret");
    const second = buildRateLimitBucketKey(request, "gemini-live-token", "test-secret");

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("198.51.100.4");
  });

  it("isolates Live token and recorded-turn budgets", () => {
    const request = new Request("https://rama.example/api/voice/token", {
      headers: { "x-real-ip": "192.0.2.20", "user-agent": "Rama test browser" },
    });

    expect(
      buildRateLimitBucketKey(request, "gemini-live-token", "test-secret"),
    ).not.toBe(
      buildRateLimitBucketKey(request, "gemini-voice-turn", "test-secret"),
    );
  });
});

