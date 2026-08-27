-- Defense in depth for private operational tables. Application access is
-- mediated by narrowly granted SECURITY DEFINER functions or service_role.
alter table private.buyer_session_token_tombstones enable row level security;
alter table private.data_rights_requests enable row level security;
alter table private.buyer_deletion_challenges enable row level security;
alter table private.buyer_deletion_authorizations enable row level security;
alter table private.processor_deletion_outbox enable row level security;
alter table private.data_retention_runs enable row level security;

-- Trigger functions are invoked by their owning triggers and do not need to
-- remain directly executable by client roles. Revoke PostgreSQL's default
-- EXECUTE grant explicitly, especially for SECURITY DEFINER functions.
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.capture_confirmed_brief_ledger() from public, anon, authenticated;
revoke all on function private.capture_candidate_evidence() from public, anon, authenticated;
