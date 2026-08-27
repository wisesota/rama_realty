import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260822223500_index_enterprise_foreign_keys.sql", import.meta.url),
  "utf8",
);

describe("enterprise foreign-key indexes", () => {
  it.each([
    "advisor_evidence_feedback (created_by)",
    "advisor_evidence_feedback (inquiry_id)",
    "advisor_evidence_feedback (property_id)",
    "evidence_assertions (buyer_session_id)",
    "evidence_assertions (property_id)",
    "properties (provider_source_id)",
    "provider_reconciliation_events (provider_source_id)",
    "provider_records_staging (published_property_id)",
  ])("indexes %s", (target) => {
    const [table, column] = target.replace(")", "").split(" (");
    const normalized = migration.toLowerCase().replace(/\s+/g, " ");
    expect(normalized).toMatch(
      new RegExp(`create index[^;]*on public\\.${table} \\([^)]*${column}`),
    );
  });
});
