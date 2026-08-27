import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { buildBuyerDecisionEnvelope } from "@/lib/discovery-service";
import {
  briefConfirmationEnabled,
  cinematicHeroEnabled,
  decisionOsEnabledForBuyer,
  evidenceV2RendererEnabled,
  evidenceV2WriterEnabled,
  landingCompositionEnabled,
  localeRoutesEnabled,
  publicExperienceEnabled,
} from "@/lib/rollout-server";

const buyerHash = "a".repeat(64);

vi.mock("@/lib/supabase/env", () => ({
  getPublicSupabaseEnvironment: vi.fn().mockReturnValue({
    url: "http://localhost:54321",
    publishableKey: "anon-key"
  }),
  getServiceRoleEnvironment: vi.fn().mockReturnValue({
    url: "http://localhost:54321",
    serviceRoleKey: "service-key"
  })
}));

vi.mock("@/lib/public-catalog-repository", () => {
  return {
    PublicCatalogRepository: class {
      search = vi.fn().mockResolvedValue({
        criteria: [],
        candidates: []
      });
    }
  };
});
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn().mockReturnValue({
    rpc: vi.fn().mockResolvedValue({
      data: {
        conversationId: "conv-1",
        searchRunId: "run-1",
        resultCount: 0,
        propertyIds: [],
        reused: false
      },
      error: null
    })
  })
}));

afterEach(() => vi.unstubAllEnvs());

describe("Decision OS rollout contract", () => {
  it("defaults repository-complete paths on while preserving independent kill switches", () => {
    expect(briefConfirmationEnabled()).toBe(true);
    expect(cinematicHeroEnabled()).toBe(true);
    expect(evidenceV2WriterEnabled()).toBe(true);
    expect(evidenceV2RendererEnabled()).toBe(true);
    expect(localeRoutesEnabled()).toBe(true);
    expect(landingCompositionEnabled()).toBe(true);
    expect(publicExperienceEnabled()).toBe(true);
    expect(decisionOsEnabledForBuyer(buyerHash)).toBe(true);

    vi.stubEnv("RAMA_BRIEF_CONFIRMATION_ENABLED", "false");
    vi.stubEnv("RAMA_CINEMATIC_HERO_ENABLED", "false");
    vi.stubEnv("RAMA_EVIDENCE_V2_WRITER_ENABLED", "false");
    vi.stubEnv("RAMA_EVIDENCE_V2_RENDERER_ENABLED", "false");
    vi.stubEnv("RAMA_LOCALE_ROUTES_ENABLED", "false");
    vi.stubEnv("RAMA_LANDING_COMPOSITION_ENABLED", "false");
    vi.stubEnv("RAMA_PUBLIC_EXPERIENCE_ENABLED", "false");
    expect(briefConfirmationEnabled()).toBe(false);
    expect(cinematicHeroEnabled()).toBe(false);
    expect(evidenceV2WriterEnabled()).toBe(false);
    expect(evidenceV2RendererEnabled()).toBe(false);
    expect(localeRoutesEnabled()).toBe(false);
    expect(landingCompositionEnabled()).toBe(false);
    expect(publicExperienceEnabled()).toBe(false);
    expect(decisionOsEnabledForBuyer(buyerHash)).toBe(false);
  });

  it("assigns partial cohorts deterministically and fails closed without a valid server secret", () => {
    vi.stubEnv("RAMA_DECISION_OS_ROLLOUT_PERCENT", "50");
    vi.stubEnv("BUYER_SESSION_SECRET", "buyer-session-rollout-secret-that-is-at-least-32-characters");
    const first = decisionOsEnabledForBuyer(buyerHash);
    expect(decisionOsEnabledForBuyer(buyerHash)).toBe(first);

    vi.stubEnv("BUYER_SESSION_SECRET", "short");
    expect(decisionOsEnabledForBuyer(buyerHash)).toBe(false);
    vi.stubEnv("BUYER_SESSION_SECRET", "buyer-session-rollout-secret-that-is-at-least-32-characters");
    vi.stubEnv("RAMA_DECISION_OS_ROLLOUT_PERCENT", "not-a-percentage");
    expect(decisionOsEnabledForBuyer(buyerHash)).toBe(false);
  });

  it("rolls new envelopes back to v1 without removing the compatible v2 writer", () => {
    const base = {
      correlationId: "correlation-1",
      searchRunId: "run-1",
      conversationId: "conversation-1",
      brief: "Dubai Marina apartment",
      source: "text" as const,
      criteria: [{ key: "location", label: "Dubai Marina", value: "Dubai Marina", kind: "hard" as const }],
      properties: [],
    };
    expect(buildBuyerDecisionEnvelope({ ...base, renderEvidenceV2: false }).schemaVersion).toBe("1");
    expect(buildBuyerDecisionEnvelope({ ...base, renderEvidenceV2: true }).schemaVersion).toBe("2");
  });

  it("keeps durable v2 writes independent from the compatible renderer rollback", async () => {
    vi.resetModules();
    vi.doMock("@/lib/rollout-server", async (importOriginal) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actual = await importOriginal<any>();
      return {
        ...actual,
        evidenceV2RendererEnabled: vi.fn().mockReturnValue(false),
        evidenceV2WriterEnabled: vi.fn().mockReturnValue(true),
      };
    });

    const { discoverProperties } = await import("@/lib/discovery-service");
    const envelope = await discoverProperties({
      brief: "Test",
      source: "text",
      idempotencyKey: "123",
      context: { correlationId: "cor-1", buyerTokenHash: "hash", deadline: Date.now() + 10000 }
    });
    expect(envelope.schemaVersion).toBe("1");
    // Assert RPC was called with writeEvidenceV2 = true
    const { createAdminClient: mockClient } = await import("@/lib/supabase/admin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcMock = mockClient().rpc as any;
    expect(rpcMock).toHaveBeenCalledWith("persist_buyer_search", expect.objectContaining({ p_write_evidence_v2: true }));

    vi.doUnmock("@/lib/supabase/admin");
    vi.doUnmock("@/lib/rollout-server");
  });

  it("gates every paid voice transport with the same stable buyer cohort", () => {
    for (const route of ["app/api/voice/token/route.ts", "app/api/voice/turn/route.ts"]) {
      const source = readFileSync(route, "utf8");
      expect(source).toContain("decisionOsEnabledForBuyer(buyerTokenHash)");
    }
  });

  it("gates buyer-authored durable ledger events with the global, cohort, and writer controls", () => {
    const source = readFileSync("app/api/decision-ledger/route.ts", "utf8");
    expect(source).toContain("!publicExperienceEnabled() || !evidenceV2WriterEnabled()");
    expect(source).toContain("decisionOsEnabledForBuyer(buyerTokenHash)");
    expect(source.indexOf("decisionOsEnabledForBuyer(buyerTokenHash)")).toBeLessThan(source.indexOf("append_buyer_ledger_event"));
  });
});
