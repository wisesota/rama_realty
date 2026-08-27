import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260822180000_buyer_data_rights_and_retention.sql"),
  "utf8",
);
const inquiryMigration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260819120000_buyer_session_token_rotation.sql"),
  "utf8",
);

describe("buyer data-rights SQL boundary", () => {
  it("owner-checks authenticated exports and never exports the opaque token hash", () => {
    const authenticatedExport = migration.indexOf("function public.export_authenticated_buyer_data");
    const anonymousExport = migration.indexOf("function public.export_anonymous_buyer_data");
    expect(migration.indexOf("actor_id is distinct from p_user_id", authenticatedExport)).toBeGreaterThan(authenticatedExport);
    expect(migration.indexOf("to authenticated;", authenticatedExport)).toBeLessThan(anonymousExport);
    expect(migration).toContain("to_jsonb(buyer) - 'token_hash'");
    expect(migration).not.toContain("'tokenHash'");
  });

  it("requires a one-time, session-bound step-up proof and an exact deliberate deletion phrase", () => {
    const deletion = migration.indexOf("function public.delete_authenticated_buyer_data");
    expect(migration.indexOf("auth.jwt() ->> 'session_id'", deletion)).toBeGreaterThan(deletion);
    expect(migration.indexOf("private.buyer_deletion_authorizations", deletion)).toBeGreaterThan(deletion);
    expect(migration.indexOf("authz.consumed_at is null", deletion)).toBeGreaterThan(deletion);
    expect(migration.indexOf("p_confirmation <> 'DELETE MY RAMA DATA'", deletion)).toBeGreaterThan(deletion);
    expect(migration.indexOf("pg_advisory_xact_lock", deletion)).toBeGreaterThan(deletion);
    expect(migration.indexOf("Staff account deletion requires administrator review", deletion)).toBeGreaterThan(deletion);
    expect(migration.indexOf("public.advisor_evidence_feedback", deletion)).toBeGreaterThan(deletion);
  });

  it("queues external processor erasure before deleting handoff records", () => {
    const deletion = migration.indexOf("function public.delete_authenticated_buyer_data");
    const outbox = migration.indexOf("insert into private.processor_deletion_outbox", deletion);
    const inquiryDelete = migration.indexOf("delete from public.inquiries", deletion);
    expect(outbox).toBeGreaterThan(deletion);
    expect(inquiryDelete).toBeGreaterThan(outbox);
    expect(migration).toContain("resource_reference uuid not null");
    expect(migration).toContain("'inquiry', inquiry.id, md5(inquiry.id::text)");
    expect(migration).toContain("'externalDeletionRequired', destinations");
    expect(migration).toContain("'retainedExceptions'");
  });

  it("keeps anonymous token-proof operations service-only", () => {
    expect(migration).toContain("revoke all on function public.export_anonymous_buyer_data(text) from public, anon, authenticated;");
    expect(migration).toContain("grant execute on function public.export_anonymous_buyer_data(text) to service_role;");
    expect(migration).toContain("revoke all on function public.delete_anonymous_buyer_data(text, text) from public, anon, authenticated;");
    expect(migration).toContain("grant execute on function public.delete_anonymous_buyer_data(text, text) to service_role;");
  });

  it("implements dry-run-first retention with the approved software defaults but no scheduler", () => {
    expect(migration).toContain("p_apply boolean default false");
    expect(migration).toContain("interval '30 days'");
    expect(migration).toContain("interval '12 months'");
    expect(migration).toContain("interval '24 months'");
    expect(migration).toContain("private.data_retention_runs");
    expect(migration).toContain("grant execute on function public.enforce_buyer_data_retention(boolean, timestamptz)");
    expect(migration).not.toContain("cron.schedule");
    expect(migration).toContain("p_as_of > now() + interval '5 minutes'");
    expect(migration).toContain("deletion.status in ('delivered', 'not_required')");
    expect(migration).toContain("deletion.completed_at < p_as_of - interval '24 months'");
    expect(migration).toContain("request.status = 'completed'");
    expect(migration.match(/hashtextextended\('buyer-data-erasure-global', 0\)/g)).toHaveLength(3);
    expect(migration).toMatch(/where event\.entity_type = 'inquiry'\r?\n\s*and event\.created_at < p_as_of - interval '24 months';/);
  });

  it("serializes inquiry creation with deletion and retention snapshots", () => {
    const inquiryFunction = inquiryMigration.indexOf("function public.create_buyer_inquiry");
    const globalLock = inquiryMigration.indexOf("hashtextextended('buyer-data-erasure-global', 0)", inquiryFunction);
    const inquiryInsert = inquiryMigration.indexOf("insert into public.inquiries", inquiryFunction);
    expect(inquiryFunction).toBeGreaterThanOrEqual(0);
    expect(globalLock).toBeGreaterThan(inquiryFunction);
    expect(inquiryInsert).toBeGreaterThan(globalLock);
  });

  it("leases processor erasure work safely and makes terminal transitions worker-owned", () => {
    expect(migration).toContain("for update skip locked");
    expect(migration).toContain("job.attempt_count < 12");
    expect(migration).toContain("job.lease_expires_at < now()");
    expect(migration).toContain("last_error_code = 'attempts_exhausted'");
    expect(migration).toContain("job.locked_by = btrim(p_worker_id)");
    expect(migration).toContain("job.lease_token = p_lease_token");
    expect(migration).toContain("where request.id = target_request_id");
    expect(migration).toContain("from private.data_rights_requests request");
    expect(migration).toContain("p_outcome not in ('delivered', 'not_required')");
    expect(migration).toContain("p_error_code !~ '^[a-z0-9_]{2,80}$'");
    expect(migration).toContain("revoke all on function public.claim_processor_deletion_jobs");
    expect(migration).toContain("grant execute on function public.fail_processor_deletion_job");
    expect(migration).toContain("request.status = 'processor_pending'");
  });
});
