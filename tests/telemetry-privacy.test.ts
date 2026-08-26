import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  scrubSentryBreadcrumb,
  scrubSentryEvent,
  sentryTraceSampleRate,
  telemetryKeyIsProtected,
} from "@/lib/telemetry-privacy";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("telemetry privacy boundaries", () => {
  it("enforces PostHog AI privacy on both the shared client and every recorded voice turn", () => {
    expect(source("lib/telemetry-server.ts")).toContain("privacyMode: true");
    expect(source("app/api/voice/turn/route.ts")).toContain("posthogPrivacyMode: true");
  });

  it("removes buyer content, identity, request payloads, and dynamic identifiers from Sentry", () => {
    const event = scrubSentryEvent({
      message: "Buyer jane@example.com requested a villa",
      transaction: "/discover/7ec9f29b-76ab-4785-b0e1-270db6294de2",
      user: { email: "jane@example.com" },
      request: { method: "POST", data: { transcript: "private" }, headers: { authorization: "secret" } },
      extra: { brief: "private" },
      contexts: { buyer: { phone: "+971 50 123 4567" } },
      breadcrumbs: [{ message: "private" }],
      spans: [{ description: "GET /rest/v1/buyer_sessions?token_hash=private", data: { "http.url": "https://example.supabase.co/rest/v1/buyer_sessions?token_hash=private" } }],
      exception: { values: [{ type: "ApiError", value: "private buyer text", stacktrace: { frames: [] } }] },
      tags: { environment: "production", transcript: "private", buyerId: "private" },
    });

    expect(event).toMatchObject({
      message: "[redacted]",
      transaction: "/discover/[id]",
      request: { method: "POST" },
      exception: { values: [{ type: "ApiError", value: "[redacted]" }] },
      tags: { environment: "production" },
    });
    expect(event.user).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.contexts).toBeUndefined();
    expect(event.breadcrumbs).toBeUndefined();
    expect(event.spans).toBeUndefined();
  });

  it("drops breadcrumb data and bounds trace sampling", () => {
    expect(scrubSentryBreadcrumb({ message: "buyer transcript", data: { token: "secret" } }))
      .toEqual({ message: "[redacted]", data: undefined });
    expect(sentryTraceSampleRate("0.1")).toBe(0.1);
    expect(sentryTraceSampleRate("2")).toBe(0.05);
    expect(telemetryKeyIsProtected("buyerTranscript")).toBe(true);
  });
});
