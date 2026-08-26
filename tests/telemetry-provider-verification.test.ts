import { describe, expect, it, vi } from "vitest";
import {
  verifyPostHogCredentials,
  verifySentryCredentials,
  verifyTelemetryProviders,
} from "../scripts/verify-telemetry-providers.mjs";

const credentials = {
  POSTHOG_PERSONAL_API_KEY: "posthog-personal-secret",
  POSTHOG_PROJECT_ID: "12345",
  POSTHOG_HOST: "https://eu.posthog.com",
  SENTRY_AUTH_TOKEN: "sentry-auth-secret",
  NEXT_PUBLIC_SENTRY_DSN: "https://public@example.ingest.sentry.io/98765",
};

describe("telemetry credential verification", () => {
  it("proves configured PostHog credentials with a bounded authenticated query", async () => {
    const request = vi.fn(async () => new Response("{}", { status: 200 }));
    const result = await verifyPostHogCredentials(credentials, request);

    expect(result).toEqual(expect.objectContaining({
      provider: "posthog",
      status: "authenticated_query_accepted",
      ok: true,
    }));
    expect(request).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain(credentials.POSTHOG_PERSONAL_API_KEY);
  });

  it("fails closed on a partial PostHog server configuration", async () => {
    const result = await verifyPostHogCredentials({ POSTHOG_PROJECT_ID: "12345" }, vi.fn());
    expect(result).toEqual({ provider: "posthog", status: "incomplete_configuration", ok: false });
  });

  it("matches an authenticated Sentry project read to the configured DSN", async () => {
    const request = vi.fn(async () => Response.json({ id: "98765" }));
    const result = await verifySentryCredentials(credentials, request);

    expect(result).toEqual(expect.objectContaining({
      provider: "sentry",
      status: "authenticated_project_matched",
      ok: true,
    }));
    expect(request).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).not.toContain(credentials.SENTRY_AUTH_TOKEN);
  });

  it("rejects a valid token when the DSN belongs to another Sentry project", async () => {
    const request = vi.fn(async () => Response.json({ id: "different-project" }));
    const result = await verifySentryCredentials(credentials, request);
    expect(result).toEqual(expect.objectContaining({ status: "dsn_project_mismatch", ok: false }));
  });

  it("treats fully absent optional telemetry providers as an intentional no-op", async () => {
    await expect(verifyTelemetryProviders({}, vi.fn())).resolves.toEqual({
      ok: true,
      providers: [
        { provider: "posthog", status: "not_configured", ok: true },
        { provider: "sentry", status: "not_configured", ok: true },
      ],
    });
  });
});
