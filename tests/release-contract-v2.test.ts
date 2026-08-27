import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => {
  const chainable = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn()
      .mockResolvedValueOnce({ data: { id: "buyer-id" }, error: null })
      .mockResolvedValueOnce({ data: { id: "run-id", conversation_id: "conv-id" }, error: null })
      .mockResolvedValue({ data: null, error: null })
  };
  return {
    createAdminClient: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue(chainable),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "Fail", message: "RPC error" } })
    })
  };
});

vi.mock("@/lib/rollout-server", () => ({
  evidenceV2RendererEnabled: vi.fn().mockReturnValue(true),
  evidenceV2WriterEnabled: vi.fn().mockReturnValue(true),
}));

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Decision OS v2 release contracts", () => {
  it("exposes only the explicit confirmation action to the canonical query route", () => {
    const store = source("stores/landing-store.ts");
    const confirmation = store.indexOf("confirmPreparedBrief: async");
    const queryCalls = [...store.matchAll(/fetch\("\/api\/discovery\/query"/g)].map((match) => match.index ?? -1);
    expect(confirmation).toBeGreaterThan(0);
    expect(queryCalls).toHaveLength(1);
    expect(queryCalls[0]).toBeGreaterThan(confirmation);
    expect(store).not.toContain("searchProperties: async");
  });

  it("fails closed on enabled ledger-read failures while preserving the v1 rollback path", async () => {
    const { loadBuyerDecisionEnvelope, PersistenceUnavailableError } = await import("@/lib/discovery-service");
    await expect(loadBuyerDecisionEnvelope("run-id", "buyer-hash")).rejects.toThrow(PersistenceUnavailableError);
  });

  it("keeps dismissal retries stable and restores comparison state after failure", () => {
    const room = source("components/buyer-decision-room.tsx");
    expect(room).toContain("dismissalKeysRef.current.get(property.id)");
    expect(room).toContain("if (wasCompared) setCompareIds");
  });

  it("keeps checked-in database types aligned with the additive v2 schema", () => {
    const types = source("lib/supabase/database.types.ts");
    for (const contract of [
      "advisor_evidence_feedback:",
      "decision_ledger_events:",
      "evidence_assertions:",
      "provider_records_staging:",
      "provider_sources:",
      "publish_validated_provider_record:",
    ]) expect(types).toContain(contract);
  });
});
