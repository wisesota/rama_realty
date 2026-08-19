import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("buyer-session security boundaries", () => {
  const migration = source("supabase/migrations/20260819120000_buyer_session_token_rotation.sql");

  it("tombstones a retired token before rotating the stable session owner", () => {
    const tombstoneWrite = migration.indexOf("insert into private.buyer_session_token_tombstones");
    const sessionUpdate = migration.indexOf("update public.buyer_sessions", tombstoneWrite);
    expect(migration).toContain("token_hash text primary key");
    expect(migration).toContain("for update;");
    expect(tombstoneWrite).toBeGreaterThan(-1);
    expect(sessionUpdate).toBeGreaterThan(tombstoneWrite);
  });

  it("rejects retired tokens before persist_buyer_search can recreate them", () => {
    const persist = migration.indexOf("create or replace function public.persist_buyer_search");
    const tombstoneCheck = migration.indexOf("Buyer token has been retired", persist);
    const createIfMissing = migration.indexOf("insert into public.buyer_sessions", persist);
    expect(tombstoneCheck).toBeGreaterThan(persist);
    expect(createIfMissing).toBeGreaterThan(tombstoneCheck);
  });

  it("rotates handoff tokens in the same transaction and exposes rotation RPCs only to service_role", () => {
    const handoff = migration.indexOf("create function public.create_buyer_inquiry");
    const rotate = migration.indexOf("perform private.rotate_buyer_session_locked", handoff);
    const returnInquiry = migration.indexOf("return inquiry_id", rotate);
    expect(rotate).toBeGreaterThan(handoff);
    expect(returnInquiry).toBeGreaterThan(rotate);
    expect(migration).toContain("grant execute on function public.rotate_buyer_session");
    expect(migration).toContain("to service_role;");
    expect(migration).toContain("from public, anon, authenticated;");
  });

  it("recovers a saved inquiry through its retired token and idempotency key", () => {
    const handoff = migration.indexOf("create function public.create_buyer_inquiry");
    const retiredLookup = migration.indexOf("private.buyer_session_token_tombstones", handoff);
    const idempotentLookup = migration.indexOf("inquiry.idempotency_key = p_idempotency_key", handoff);
    const retryTokenGuard = migration.indexOf("token_hash = p_next_token_hash", handoff);
    expect(retiredLookup).toBeGreaterThan(handoff);
    expect(idempotentLookup).toBeGreaterThan(retiredLookup);
    expect(retryTokenGuard).toBeGreaterThan(idempotentLookup);
  });

  it("uses conflict-safe first-use buyer-session persistence", () => {
    const persist = migration.indexOf("create or replace function public.persist_buyer_search");
    expect(migration.indexOf("on conflict (token_hash) do nothing", persist)).toBeGreaterThan(persist);
    expect(migration.indexOf("Buyer token is unavailable", persist)).toBeGreaterThan(persist);
  });
});

describe("hosted Supabase verification", () => {
  const verifier = source("scripts/verify-supabase.mjs");

  it("checks the operational search and audit tables without treating server errors as denial", () => {
    expect(verifier).toContain('"search_runs"');
    expect(verifier).toContain('"audit_events"');
    expect(verifier).toContain("response.status !== 401 && response.status !== 403");
    expect(verifier).toContain("verify_operational_security_posture");
    expect(verifier).toContain("row.rls_enabled !== true || row.anon_select === true");
    expect(verifier).not.toContain("const rows = response.ok ? await response.json() : [];");
  });
});
