import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../supabase/migrations/20260822174500_advisor_evidence_feedback.sql", import.meta.url), "utf8");

describe("advisor evidence feedback", () => {
  it("requires the authenticated actor and an advisor-capable organization role", () => {
    expect(migration).toContain("p_actor_id is distinct from auth.uid()");
    expect(migration).toContain("private.has_org_role(inquiry.organization_id, array['owner','admin','agent'])");
  });

  it("does not grant direct table access to browser roles", () => {
    expect(migration).toContain("revoke all on public.advisor_evidence_feedback from public, anon, authenticated");
  });

  it("normalizes a blank optional outcome to null before validation and storage", () => {
    expect(migration).toContain("nullif(btrim(p_outcome), '') is not null");
    expect(migration).toContain("p_category, nullif(btrim(p_outcome), '')");
  });
});
