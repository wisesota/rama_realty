import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260822164500_evidence_ledger_v2.sql", import.meta.url),
  "utf8",
);
const assertionKeyFix = readFileSync(
  new URL("../supabase/migrations/20260822214500_fix_candidate_evidence_assertion_key.sql", import.meta.url),
  "utf8",
);

describe("evidence ledger migration", () => {
  it("keeps evidence and ledger tables private to the service boundary", () => {
    expect(migration).toContain("alter table public.evidence_assertions enable row level security");
    expect(migration).toContain("alter table public.decision_ledger_events enable row level security");
    expect(migration).toContain("revoke all on public.evidence_assertions, public.decision_ledger_events from public, anon, authenticated");
  });

  it("captures confirmed briefs and immutable candidate snapshots through triggers", () => {
    expect(migration).toContain("search_runs_capture_confirmed_brief");
    expect(migration).toContain("search_candidates_capture_evidence");
    expect(migration).toContain("new.fact_snapshot");
    expect(migration).toContain("content_hash");
    expect(migration).toContain("'candidate-seen:' || new.search_run_id::text || ':' || new.property_id");
    expect(migration.match(/current_setting\('rama\.write_evidence_v2', true\)/g)).toHaveLength(2);
  });

  it("authorizes ledger writes against the buyer-owned search run", () => {
    const append = migration.indexOf("create or replace function public.append_buyer_ledger_event");
    expect(append).toBeGreaterThan(0);
    expect(migration.indexOf("run.buyer_session_id = session.id", append)).toBeGreaterThan(append);
    expect(migration.indexOf("candidate.search_run_id = p_search_run_id", append)).toBeGreaterThan(append);
    expect(migration.indexOf("p_event_type = 'candidate_dismissed' and p_property_id is null", append)).toBeGreaterThan(append);
  });

  it("scopes candidate events to a search run so repeat candidates retain history", () => {
    expect(migration).toContain("'candidate-seen:' || new.search_run_id::text || ':' || new.property_id");
  });

  it("keeps the evidence assertion column distinct from its PL/pgSQL value", () => {
    for (const sql of [migration, assertionKeyFix]) {
      expect(sql).toContain("candidate_assertion_key text");
      expect(sql).toContain("candidate_assertion_key := new.search_run_id::text");
      expect(sql).not.toMatch(/\n\s*assertion_key text;/);
    }
    expect(assertionKeyFix).toContain(
      "revoke all on function private.capture_candidate_evidence() from public, anon, authenticated;",
    );
  });
});
