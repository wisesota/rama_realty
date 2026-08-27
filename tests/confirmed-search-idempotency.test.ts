import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260822161500_confirmed_search_idempotency.sql", import.meta.url),
  "utf8",
);
const counterFix = readFileSync(
  new URL("../supabase/migrations/20260822215500_fix_confirmed_search_counter.sql", import.meta.url),
  "utf8",
);

describe("confirmed search idempotency", () => {
  it("returns the exact persisted property ids for new and retried confirmations", () => {
    expect(migration.match(/'propertyIds', persisted_property_ids/g)).toHaveLength(2);
    expect(migration).toContain("'reused', true");
    expect(migration).toContain("'reused', false");
    expect(migration).toContain("array_agg(property_id order by rank)");
    expect(migration).toContain("array_append(persisted_property_ids, candidate ->> 'propertyId')");
    for (const sql of [migration, counterFix]) {
      expect(sql).toMatch(/end if;\s+inserted_count := 0;\s+select id into conversation_id/);
    }
  });

  it("sets a transaction-local evidence writer gate before trigger-owned inserts", () => {
    expect(migration).toContain("p_write_evidence_v2 boolean default true");
    expect(migration).toContain("pg_catalog.set_config(");
    expect(migration).toContain("'rama.write_evidence_v2'");
  });

  it("rejects a null idempotency key before attempting persistence", () => {
    expect(migration).toContain("p_idempotency_key is null or char_length(p_idempotency_key) not between 16 and 128");
  });
});
