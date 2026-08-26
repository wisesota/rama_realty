import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { criteriaSlipFromPreparedBrief } from "@/components/rama/criteria-slip";
import { prepareBriefDraft } from "@/lib/brief-confirmation";
import { landingCopy } from "@/lib/i18n";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return [value.length, value[0] === undefined ? null : shape(value[0])];
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]));
  }
  return typeof value;
}

describe("Rama Decision Architecture", () => {
  it("keeps the complete section and state copy shape equivalent in English and Arabic", () => {
    expect(shape(landingCopy.en.architecture)).toEqual(shape(landingCopy.ar.architecture));
    expect(landingCopy.en.architecture.specimen.items.map((item) => item.stage)).toEqual([
      "brief",
      "fit",
      "evidence",
      "open_question",
      "ledger_change",
    ]);
    expect(landingCopy.ar.architecture.faq.items).toHaveLength(landingCopy.en.architecture.faq.items.length);
  });

  it("maps a prepared buyer brief into required, preferred, unknown, and contradiction planes", () => {
    const draft = prepareBriefDraft({
      brief: "Both apartment and villa in Dubai Marina under AED 3M with a balcony",
      source: "text",
      draftId: "draft-1",
    });
    const model = criteriaSlipFromPreparedBrief(draft);

    expect(model.source).toBe("buyer");
    expect(model.required.length).toBeGreaterThan(0);
    expect(model.preferred.some((criterion) => criterion.label === "Balcony")).toBe(true);
    expect(model.unknowns).not.toContain("preferred area");
    expect(model.contradictions).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "property_type_conflict" }),
    ]));
  });

  it("publishes every Decision Architecture primitive with corrected button dependencies", () => {
    const registry = JSON.parse(readFileSync("registry.json", "utf8")) as {
      items: Array<{
        name: string;
        dependencies?: string[];
        registryDependencies?: string[];
        files?: Array<{ path: string; target?: string }>;
      }>;
    };
    const names = registry.items.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining([
      "voice-action",
      "gemini-live-signal",
      "voice-discovery-dialog",
      "cinematic-hero-media",
      "decision-aperture",
      "landing-motion",
      "blur-fade",
      "scroll-progress",
      "progressive-blur",
      "state-transition",
      "editorial-media",
      "criteria-slip",
      "evidence-state",
      "boundary-ledger",
      "process-rail",
      "decision-specimen",
      "comparison-plane",
      "decision-ledger-timeline",
      "consent-handoff",
    ]));
    expect(registry.items.find((item) => item.name === "button")?.dependencies).toEqual([
      "class-variance-authority",
      "react-aria-components",
    ]);
    expect(registry.items.find((item) => item.name === "voice-action")?.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "lib/voice/types.ts" }),
    ]));
    expect(registry.items.find((item) => item.name === "voice-discovery-dialog")?.registryDependencies).toContain("gemini-live-signal");
    expect(registry.items.find((item) => item.name === "voice-discovery-dialog")?.registryDependencies).toContain("state-transition");
    expect(registry.items.find((item) => item.name === "scroll-progress")?.dependencies).toBeUndefined();
    expect(registry.items.find((item) => item.name === "cinematic-hero-media")?.files).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "public/images/rama-dubai-residential-cityscape-hero-1280.avif" }),
      expect.objectContaining({ path: "public/images/rama-dubai-residential-cityscape-mobile-720.avif" }),
    ]));
    expect(registry.items.find((item) => item.name === "editorial-media")?.files).toEqual([
      expect.objectContaining({ path: "components/rama/editorial-media.tsx" }),
    ]);
  });

  it("keeps long-page orientation and voice transitions accessible by contract", () => {
    const header = readFileSync("components/site-header.tsx", "utf8");
    const stateTransition = readFileSync("components/ui/state-transition.tsx", "utf8");
    const voiceConversation = readFileSync("components/voice-conversation.tsx", "utf8");

    expect(header).toContain("new IntersectionObserver");
    expect(header).toContain('rootMargin: "-18% 0px -70% 0px"');
    expect(header).toContain('aria-current={activeHref === item.href ? "location" : undefined}');
    expect(stateTransition).toContain('mode="wait"');
    expect(stateTransition).toContain("key={state}");
    expect(stateTransition).toContain("useReducedMotion");
    expect(stateTransition).toContain("y: 4");
    expect(stateTransition).not.toContain("layout=");
    expect(voiceConversation).toContain("<StateTransition state={state.phase}");
  });

  it("keeps Gemini Live motion stateful while idle and reduced-motion playback remain bounded", () => {
    const liveSignal = readFileSync("components/rama/gemini-live-signal.tsx", "utf8");
    const landingMotion = readFileSync("components/rama/landing-motion.tsx", "utf8");

    expect(liveSignal).toContain('resting: { direction: "forward", frame: 0, loop: false');
    expect(liveSignal).toContain("player.setLoop(reducedMotion ? false : behavior.loop)");
    expect(liveSignal).toContain("if (!reducedMotion) player.play()");
    expect(liveSignal).toContain("<AnimatePresence initial={false} mode=\"wait\">");
    expect(landingMotion).toContain('window.addEventListener("rama:discovery-dialog-state", animateHeroHandoff)');
  });

  it("localizes a complete illustrative media set without turning scenes into inventory", () => {
    expect(landingCopy.en.architecture.media.architecture).toHaveLength(2);
    const expectedMediaPaths = {
      "waterfront-routine": "/images/rama-waterfront-daylight-interior.webp",
      "family-transition": "/images/rama-green-courtyard-community.webp",
      "calm-city-base": "/images/rama-walkable-transit-district.webp",
      "long-horizon": "/images/rama-urban-shade-tower.webp",
    };
    expect(Object.fromEntries(Object.entries(landingCopy.en.architecture.media.examples).map(([id, media]) => [id, media.src])))
      .toEqual(expectedMediaPaths);
    expect(Object.fromEntries(Object.entries(landingCopy.ar.architecture.media.examples).map(([id, media]) => [id, media.src])))
      .toEqual(expectedMediaPaths);
    expect(landingCopy.en.architecture.examples.items.map((item) => item.id))
      .toEqual(Object.keys(expectedMediaPaths));
    expect(landingCopy.ar.architecture.examples.items.map((item) => item.id))
      .toEqual(Object.keys(expectedMediaPaths));
    expect(JSON.stringify(landingCopy.en.architecture.media)).toMatch(/not a listing/i);
    expect(JSON.stringify(landingCopy.ar.architecture.media)).toContain("توضيحي");
  });

  it("keeps unsupported credibility and market-performance claims out of active public copy", () => {
    const active = [
      readFileSync("components/decision-architecture-landing.tsx", "utf8"),
      JSON.stringify(landingCopy),
    ].join("\n");
    expect(active).not.toMatch(/award[- ]winning|trusted by|verified reviews|client satisfaction|guaranteed (?:yield|return)|exclusive allocation/i);
  });

  it("persists the pinned cinematic direction contract in the root artifact", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("THESIS: Dubai residential architecture frames the choice");
    expect(layout).toContain("OWN-WORLD:");
    expect(layout).toContain("STORY:");
    expect(layout).toContain("FIRST VIEWPORT:");
    expect(layout).toContain("seed key rama-residential-horizon-pinned-20260824");
    expect(layout).toContain("FINISH: unreviewed and undocumented is unfinished");
  });

  it("keeps intercepted Decision Room routes stable in local and demo development", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    const demoScript = readFileSync("scripts/demo.mjs", "utf8");
    expect(packageJson.scripts.dev).toBe("next dev --webpack");
    expect(demoScript).toContain('"next", "dev", "--webpack"');
  });

  it("preserves early composer intent without rendering a disabled primary action", () => {
    const landing = readFileSync("components/landing-page.tsx", "utf8");
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).not.toContain("discoveryIntentBridge");
    expect(landing).toContain('name="briefMode"');
    expect(landing).toContain("openFromQuery");
    expect(landing).not.toContain("isDisabled={!composerReady}");
  });
});
