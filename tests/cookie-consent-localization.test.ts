import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const banner = readFileSync(
  new URL("../components/rama/cookie-consent-banner.tsx", import.meta.url),
  "utf8",
);
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

describe("cookie consent localization", () => {
  it("uses the request locale for consent copy and keeps the dialog responsive", () => {
    expect(layout).toContain("<CookieConsentBanner locale={locale} />");
    expect(banner).toContain("نحترم خصوصيتك");
    expect(banner).toContain("بإذنك، تستخدم راما تحليلات PostHog");
    expect(banner).toContain('role="dialog"');
    expect(banner).toContain('className="cookie-consent-banner"');
    expect(styles).toMatch(/\.cookie-consent-banner\s*\{[\s\S]*?inset-inline:\s*max\(1rem, calc\(\(100vw - var\(--content-max\)\) \/ 2\)\);[\s\S]*?padding:\s*var\(--rama-legacy-dimension-positive-1rem\);/);
  });

  it("loads analytics and authenticated identity only after consent", () => {
    expect(banner).not.toMatch(/^import\s+(?!type\b).*from ['"]posthog-js['"]/m);
    expect(banner).toContain("initialization.current = import('posthog-js')");
    expect(banner).toContain("if (choice === 'accepted')");
    expect(banner).toContain("import('@/lib/supabase/client')");
  });

  it("never sends query parameters or callback tokens in pageview URLs", () => {
    expect(banner).not.toContain("useSearchParams");
    expect(banner).toContain("$current_url: `${window.origin}${pathname}`");
  });
});
