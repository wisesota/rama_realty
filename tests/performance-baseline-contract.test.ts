import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("performance baseline harness", () => {
  it("uses five cold desktop and Fast 3G mobile runs by default", () => {
    const source = readFileSync("scripts/capture-performance-baseline.mjs", "utf8");

    expect(source).toContain('readArgument("--runs") ?? "5"');
    expect(source).toContain('id: "desktop"');
    expect(source).toContain('id: "mobile-fast3g"');
    expect(source).toContain("rttMs: 150");
    expect(source).toContain("throughputKbps: 1638.4");
  });

  it("records the release thresholds and bundle transfer sizes", () => {
    const source = readFileSync("scripts/capture-performance-baseline.mjs", "utf8");

    expect(source).toContain("lcpMs: 2500");
    expect(source).toContain("cls: 0.1");
    expect(source).toContain("inpMs: 200");
    expect(source).toContain('resourceBytes(audits, "script")');
    expect(source).toContain('resourceBytes(audits, "stylesheet")');
  });

  it("keeps the mobile LCP heading out of late GSAP hero mutation", () => {
    const source = readFileSync("components/rama/landing-motion.tsx", "utf8");

    expect(source).toContain('window.matchMedia("(max-width: 767px)").matches');
    expect(source).toContain("if (!compactViewport && performance.now() - requestedAt < 400)");
    expect(source).toContain('window.addEventListener("scroll", registerCompactMotion, { once: true, passive: true })');
    expect(source).toContain('window.removeEventListener("scroll", registerCompactMotion)');
  });

  it("preloads the editorial hero font and the responsive AVIF before LCP", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const hero = readFileSync("components/rama/cinematic-hero-media.tsx", "utf8");

    expect(layout.match(/display: "swap"/g)).toHaveLength(2);
    expect(layout.match(/weight: \["400", "500", "600", "700"\]/g)).toHaveLength(1);
    expect(layout.match(/preload: false/g)).toBeNull();
    expect(hero.match(/rel="preload"/g)).toHaveLength(2);
    expect(hero).toContain('media="(max-width: 700px)"');
    expect(hero).toContain('type="image/avif"');
  });

  it("does not send GSAP to mobile user agents", () => {
    const source = readFileSync("app/[locale]/page.tsx", "utf8");

    expect(source).toContain("motionEnabled");
    expect(source).toContain("Android|iPhone|iPad|iPod|Mobile");
  });
});
