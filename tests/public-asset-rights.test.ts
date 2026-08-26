import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Asset = {
  path: string;
  sha256: string;
  bytes: number;
  documentaryProof: string | null;
  legalReview: string;
  productionEligibility: string;
  localizedAlternativeText?: { en: string; ar: string };
  accessibilityTreatment?: string;
  sourceUrl?: string;
  licenseUrl?: string;
};

const registry = JSON.parse(readFileSync("docs/PUBLIC_ASSET_RIGHTS.json", "utf8")) as {
  productionConclusion: string;
  assets: Asset[];
};

describe("public asset rights register", () => {
  it("registers every asset imported by the approved public landing runtime", () => {
    const sources = [
      readFileSync("components/landing-page.tsx", "utf8"),
      readFileSync("components/decision-architecture-landing.tsx", "utf8"),
      readFileSync("components/rama/example-briefs.tsx", "utf8"),
      readFileSync("components/rama/editorial-media.tsx", "utf8"),
      readFileSync("components/lottie-visualizer.tsx", "utf8"),
      readFileSync("components/rama/cinematic-hero-media.tsx", "utf8"),
      readFileSync("components/voice-signal.tsx", "utf8"),
      readFileSync("app/auth/sign-in/sign-in.css", "utf8"),
      readFileSync("lib/i18n.ts", "utf8"),
    ].join("\n");
    const imported = [...new Set([...sources.matchAll(/\/(?:images|lottie|video)\/[a-zA-Z0-9_.-]+/g)].map((match) => `public${match[0]}`))].sort();
    expect(imported).toEqual(registry.assets.map((asset) => asset.path).sort());
  });

  it("binds each record to exact bytes and keeps documentary review visibly open", () => {
    expect(registry.productionConclusion).toBe("documentary_evidence_open");
    for (const asset of registry.assets) {
      const bytes = readFileSync(asset.path);
      expect(bytes.byteLength).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      if (asset.path.endsWith("rama-criterion-weave.json")) {
        expect(asset.documentaryProof).toContain("Source-authored Rama Criterion Weave");
        expect(asset.legalReview).toBe("not_required_original_geometric_asset");
        expect(asset.productionEligibility).toBe("eligible");
      } else if (asset.documentaryProof?.startsWith("Codex task generation record ")) {
        expect(asset.legalReview).toBe("pending");
        expect(asset.documentaryProof).toMatch(/^Codex task generation record /);
        expect(asset.productionEligibility).toBe("blocked_pending_legal_review");
      } else if (asset.sourceUrl && asset.licenseUrl) {
        expect(asset.documentaryProof).toContain(asset.sourceUrl);
        expect(asset.documentaryProof).toContain(asset.licenseUrl);
        expect(asset.legalReview).toBe("pending");
        expect(asset.productionEligibility).toBe("blocked_pending_legal_review");
      } else {
        expect(asset.legalReview).toBe("pending");
        expect(asset.documentaryProof).toBeNull();
        expect(asset.productionEligibility).toBe("blocked_pending_documentary_proof");
      }
    }
  });

  it("requires localized image alternatives while decorative motion remains text-independent", () => {
    const images = registry.assets.filter((asset) => /\.(?:avif|jpe?g|png|webp)$/.test(asset.path));
    const lottie = registry.assets.filter((asset) => asset.path.endsWith(".json"));
    for (const image of images) {
      expect(image.localizedAlternativeText?.en.length).toBeGreaterThan(20);
      expect(image.localizedAlternativeText?.ar.length).toBeGreaterThan(20);
    }
    for (const asset of lottie) expect(asset.accessibilityTreatment).toContain("aria-hidden");
    const visualizer = readFileSync("components/lottie-visualizer.tsx", "utf8");
    expect(visualizer).toContain("loop={loop && !reducedMotion}");
    expect(visualizer).toContain("autoplay={active && !reducedMotion}");
  });
});
