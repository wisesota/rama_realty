import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260822211710_harden_private_trigger_function_privileges.sql",
  ),
  "utf8",
);

describe("private Supabase schema hardening", () => {
  it("enables defense-in-depth RLS on every private operational table", () => {
    for (const table of [
      "buyer_session_token_tombstones",
      "data_rights_requests",
      "buyer_deletion_challenges",
      "buyer_deletion_authorizations",
      "processor_deletion_outbox",
      "data_retention_runs",
    ]) {
      expect(migration).toContain(
        `alter table private.${table} enable row level security;`,
      );
    }
  });

  it("removes direct client execution from private trigger functions", () => {
    for (const routine of [
      "handle_new_user",
      "set_updated_at",
      "capture_confirmed_brief_ledger",
      "capture_candidate_evidence",
    ]) {
      expect(migration).toContain(
        `revoke all on function private.${routine}() from public, anon, authenticated;`,
      );
    }
  });
});
