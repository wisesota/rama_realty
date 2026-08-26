import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Next.js observability conventions", () => {
  it("initializes privacy-safe, error-only client monitoring after first paint", () => {
    const source = readFileSync("instrumentation-client.ts", "utf8");

    expect(source).toContain('initialization = import("@sentry/nextjs")');
    expect(source).toContain("Sentry.init(");
    expect(source).toContain("tracesSampleRate: 0");
    expect(source).not.toContain("captureRouterTransitionStart");
    expect(source).toContain('window.addEventListener("error", queueWindowError)');
    expect(source).toContain("for (const error of queuedErrors.splice(0)) Sentry.captureException(error)");
    expect(source).toContain("window.setTimeout(() => void initializeSentry(), 3_000)");
    expect(source).toContain("sendDefaultPii: false");
    expect(source).toContain("beforeSend: scrubSentryEvent");

    const config = readFileSync("next.config.ts", "utf8");
    expect(config).toContain("suppressOnRouterTransitionStartWarning: true");
  });

  it("captures root render failures and provides an accessible retry", () => {
    const source = readFileSync("app/global-error.tsx", "utf8");

    expect(source).toContain('"use client"');
    expect(source).toContain("Sentry.captureException(error)");
    expect(source).toContain("<html lang=\"en\"");
    expect(source).toContain('type="button"');
    expect(source).toContain("onClick={reset}");
  });
});
