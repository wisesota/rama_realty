import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

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

  it("fails closed on enabled ledger-read failures while preserving the v1 rollback path", () => {
    const discovery = source("lib/discovery-service.ts");
    expect(discovery).toContain("if (ledgerError) throw new PersistenceUnavailableError()");
    expect(discovery).toContain("? admin.rpc(\"read_buyer_ledger_events\"");
    expect(discovery).toContain("p_write_evidence_v2: writeEvidenceV2");
    expect(discovery).toContain("const renderEvidenceV2 = evidenceV2RendererEnabled()");
    expect(discovery).toContain("if (data.reused)");
    expect(discovery).toContain("loadBuyerDecisionEnvelope(data.searchRunId, options.context.buyerTokenHash)");
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
