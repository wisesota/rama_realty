-- Buyer data-rights and retention foundation.
--
-- The browser never receives direct access to the operational tables below.
-- Authenticated exports/deletions prove ownership with auth.uid(); anonymous
-- operations are service-role-only and prove ownership with the HMAC token hash
-- from the current HttpOnly buyer cookie. Retention defaults are implemented but
-- intentionally unscheduled until legal approval and hosted verification exist.

create table if not exists private.data_rights_requests (
  id uuid primary key default gen_random_uuid(),
  subject_hash text not null check (subject_hash ~ '^[a-f0-9]{32}$'),
  request_type text not null check (request_type in ('authenticated_deletion','anonymous_deletion')),
  status text not null check (status in ('processing','processor_pending','completed')),
  result_counts jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 months')
);

create index if not exists data_rights_requests_expiry_idx
  on private.data_rights_requests (expires_at);

create table if not exists private.buyer_deletion_challenges (
  challenge_hash text primary key check (challenge_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz
);

create index if not exists buyer_deletion_challenges_user_idx
  on private.buyer_deletion_challenges (user_id, expires_at desc);

create table if not exists private.buyer_deletion_authorizations (
  authorization_hash text primary key check (authorization_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid not null,
  session_id uuid not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  consumed_at timestamptz
);

create index if not exists buyer_deletion_authorizations_user_idx
  on private.buyer_deletion_authorizations (user_id, session_id, expires_at desc);

create table if not exists private.processor_deletion_outbox (
  id bigint generated always as identity primary key,
  request_id uuid not null,
  destination text not null check (char_length(destination) between 2 and 160),
  resource_type text not null check (resource_type = 'inquiry'),
  resource_reference uuid not null,
  processor_record_id text check (
    processor_record_id is null or char_length(processor_record_id) between 1 and 256
  ),
  resource_hash text not null check (resource_hash ~ '^[a-f0-9]{32}$'),
  status text not null default 'pending' check (status in ('pending','processing','delivered','failed','not_required')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text check (locked_by is null or char_length(locked_by) between 2 and 160),
  lease_token uuid,
  lease_expires_at timestamptz,
  last_error_code text check (last_error_code is null or last_error_code ~ '^[a-z0-9_]{2,80}$'),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 months'),
  unique (request_id, destination, resource_type, resource_hash)
);

create index if not exists processor_deletion_outbox_delivery_idx
  on private.processor_deletion_outbox (status, available_at, id);
create index if not exists processor_deletion_outbox_expiry_idx
  on private.processor_deletion_outbox (expires_at);

create table if not exists private.data_retention_runs (
  id uuid primary key default gen_random_uuid(),
  as_of timestamptz not null,
  mode text not null check (mode in ('dry_run','apply')),
  status text not null check (status in ('completed')),
  result_counts jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 months')
);

create index if not exists data_retention_runs_expiry_idx
  on private.data_retention_runs (expires_at);

revoke all on private.data_rights_requests, private.buyer_deletion_challenges,
  private.buyer_deletion_authorizations, private.processor_deletion_outbox,
  private.data_retention_runs from public, anon, authenticated;
grant select, insert, update, delete on private.data_rights_requests,
  private.buyer_deletion_challenges, private.buyer_deletion_authorizations,
  private.processor_deletion_outbox, private.data_retention_runs to service_role;
grant usage, select on sequence private.processor_deletion_outbox_id_seq to service_role;

create or replace function public.claim_processor_deletion_jobs(
  p_worker_id text,
  p_limit integer default 20,
  p_lease_seconds integer default 300
)
returns table (
  id bigint,
  request_id uuid,
  destination text,
  resource_type text,
  resource_reference uuid,
  processor_record_id text,
  attempt_count integer,
  lease_token uuid,
  lease_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if nullif(btrim(p_worker_id), '') is null or char_length(p_worker_id) > 160
    or p_limit < 1 or p_limit > 100
    or p_lease_seconds < 60 or p_lease_seconds > 3600
  then
    raise exception 'Invalid processor deletion worker claim' using errcode = '22023';
  end if;

  update private.processor_deletion_outbox job
  set status = 'failed',
      available_at = now() + interval '24 hours',
      locked_at = null,
      locked_by = null,
      lease_token = null,
      lease_expires_at = null,
      last_error_code = 'attempts_exhausted'
  where job.attempt_count >= 12
    and job.last_error_code is distinct from 'attempts_exhausted'
    and (
      job.status = 'failed'
      or (job.status = 'processing' and job.lease_expires_at < now())
    );

  return query
  with claimable as (
    select job.id
    from private.processor_deletion_outbox job
    where job.attempt_count < 12
      and (
        (job.status in ('pending', 'failed') and job.available_at <= now())
        or (
          job.status = 'processing'
          and job.lease_expires_at < now()
        )
      )
    order by job.available_at, job.id
    for update skip locked
    limit p_limit
  )
  update private.processor_deletion_outbox job
  set status = 'processing',
      attempt_count = job.attempt_count + 1,
      locked_at = now(),
      locked_by = btrim(p_worker_id),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      last_error_code = null
  from claimable
  where job.id = claimable.id
  returning job.id, job.request_id, job.destination, job.resource_type,
    job.resource_reference, job.processor_record_id, job.attempt_count,
    job.lease_token, job.lease_expires_at;
end;
$$;

revoke all on function public.claim_processor_deletion_jobs(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_processor_deletion_jobs(text, integer, integer)
  to service_role;

create or replace function public.complete_processor_deletion_job(
  p_job_id bigint,
  p_worker_id text,
  p_lease_token uuid,
  p_outcome text,
  p_processor_record_id text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  completed_count integer := 0;
  target_request_id uuid;
begin
  if nullif(btrim(p_worker_id), '') is null
    or p_lease_token is null
    or p_outcome not in ('delivered', 'not_required')
    or (p_processor_record_id is not null and char_length(btrim(p_processor_record_id)) not between 1 and 256)
  then
    raise exception 'Invalid processor deletion completion' using errcode = '22023';
  end if;

  select job.request_id into target_request_id
  from private.processor_deletion_outbox job
  where job.id = p_job_id
    and job.status = 'processing'
    and job.locked_by = btrim(p_worker_id)
    and job.lease_token = p_lease_token
  for update;
  if target_request_id is null then
    raise exception 'Processor deletion lease is not owned by this worker' using errcode = '55000';
  end if;
  perform 1 from private.data_rights_requests request
  where request.id = target_request_id
  for update;

  update private.processor_deletion_outbox job
  set status = p_outcome,
      processor_record_id = coalesce(nullif(btrim(p_processor_record_id), ''), job.processor_record_id),
      completed_at = now(),
      expires_at = now() + interval '24 months',
      locked_at = null,
      locked_by = null,
      lease_token = null,
      lease_expires_at = null,
      last_error_code = null
  where job.id = p_job_id
    and job.status = 'processing'
    and job.locked_by = btrim(p_worker_id)
    and job.lease_token = p_lease_token;
  get diagnostics completed_count = row_count;

  if completed_count <> 1 then
    raise exception 'Processor deletion lease is not owned by this worker' using errcode = '55000';
  end if;
  update private.data_rights_requests request
  set status = 'completed',
      completed_at = now(),
      expires_at = now() + interval '24 months'
  where request.id = target_request_id
    and request.status = 'processor_pending'
    and not exists (
      select 1 from private.processor_deletion_outbox pending
      where pending.request_id = request.id
        and pending.status not in ('delivered', 'not_required')
    );
  return true;
end;
$$;

revoke all on function public.complete_processor_deletion_job(bigint, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.complete_processor_deletion_job(bigint, text, uuid, text, text)
  to service_role;

create or replace function public.fail_processor_deletion_job(
  p_job_id bigint,
  p_worker_id text,
  p_lease_token uuid,
  p_error_code text,
  p_retry_delay_seconds integer default 300
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  failed_count integer := 0;
begin
  if nullif(btrim(p_worker_id), '') is null
    or p_lease_token is null
    or p_error_code !~ '^[a-z0-9_]{2,80}$'
    or p_retry_delay_seconds < 60 or p_retry_delay_seconds > 86400
  then
    raise exception 'Invalid processor deletion failure result' using errcode = '22023';
  end if;

  update private.processor_deletion_outbox job
  set status = 'failed',
      available_at = now() + make_interval(secs => p_retry_delay_seconds),
      locked_at = null,
      locked_by = null,
      lease_token = null,
      lease_expires_at = null,
      last_error_code = p_error_code
  where job.id = p_job_id
    and job.status = 'processing'
    and job.locked_by = btrim(p_worker_id)
    and job.lease_token = p_lease_token;
  get diagnostics failed_count = row_count;

  if failed_count <> 1 then
    raise exception 'Processor deletion lease is not owned by this worker' using errcode = '55000';
  end if;
  return true;
end;
$$;

revoke all on function public.fail_processor_deletion_job(bigint, text, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.fail_processor_deletion_job(bigint, text, uuid, text, integer)
  to service_role;

create or replace function public.create_buyer_deletion_challenge(
  p_user_id uuid,
  p_challenge_hash text
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  challenge_expires_at timestamptz := now() + interval '10 minutes';
begin
  if p_user_id is null or p_challenge_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid buyer deletion challenge' using errcode = '22023';
  end if;

  update private.buyer_deletion_challenges
  set consumed_at = coalesce(consumed_at, now())
  where user_id = p_user_id and consumed_at is null;

  insert into private.buyer_deletion_challenges (
    challenge_hash, user_id, expires_at
  ) values (
    p_challenge_hash, p_user_id, challenge_expires_at
  );

  return challenge_expires_at;
end;
$$;

revoke all on function public.create_buyer_deletion_challenge(uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_buyer_deletion_challenge(uuid, text)
  to service_role;

create or replace function public.complete_buyer_deletion_challenge(
  p_user_id uuid,
  p_challenge_hash text,
  p_session_id uuid,
  p_authorization_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed_count integer := 0;
begin
  if p_user_id is null or p_session_id is null
    or p_challenge_hash !~ '^[a-f0-9]{64}$'
    or p_authorization_hash !~ '^[a-f0-9]{64}$'
  then
    raise exception 'Invalid buyer deletion authorization' using errcode = '22023';
  end if;

  update private.buyer_deletion_challenges
  set consumed_at = now()
  where challenge_hash = p_challenge_hash
    and user_id = p_user_id
    and consumed_at is null
    and expires_at > now();
  get diagnostics consumed_count = row_count;

  if consumed_count <> 1 then
    raise exception 'Buyer deletion challenge is invalid or expired' using errcode = '42501';
  end if;

  insert into private.buyer_deletion_authorizations (
    authorization_hash, user_id, session_id
  ) values (
    p_authorization_hash, p_user_id, p_session_id
  );

  return true;
end;
$$;

revoke all on function public.complete_buyer_deletion_challenge(uuid, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.complete_buyer_deletion_challenge(uuid, text, uuid, text)
  to service_role;

create or replace function public.export_authenticated_buyer_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
begin
  if actor_id is null or actor_id is distinct from p_user_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'exportVersion', 'rama-buyer-export/1.0',
    'generatedAt', now(),
    'ownerType', 'authenticated',
    'profile', (
      select to_jsonb(profile)
      from public.profiles profile
      where profile.id = p_user_id
    ),
    'savedBriefs', coalesce((
      select jsonb_agg(to_jsonb(brief) order by brief.created_at, brief.id)
      from public.search_briefs brief
      where brief.user_id = p_user_id
    ), '[]'::jsonb),
    'savedShortlist', coalesce((
      select jsonb_agg(to_jsonb(item) order by item.created_at, item.property_id)
      from public.shortlist_items item
      where item.user_id = p_user_id
    ), '[]'::jsonb),
    'buyerSessions', coalesce((
      select jsonb_agg(to_jsonb(buyer) - 'token_hash' order by buyer.created_at, buyer.id)
      from public.buyer_sessions buyer
      where buyer.user_id = p_user_id
    ), '[]'::jsonb),
    'searchRuns', coalesce((
      select jsonb_agg(to_jsonb(run) order by run.created_at, run.id)
      from public.search_runs run
      where run.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = run.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb),
    'searchCandidates', coalesce((
      select jsonb_agg(to_jsonb(candidate) order by candidate.search_run_id, candidate.rank, candidate.property_id)
      from public.search_candidates candidate
      join public.search_runs run on run.id = candidate.search_run_id
      where run.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = run.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb),
    'decisionLedger', coalesce((
      select jsonb_agg(to_jsonb(event) order by event.occurred_at, event.id)
      from public.decision_ledger_events event
      join public.buyer_sessions buyer on buyer.id = event.buyer_session_id
      where buyer.user_id = p_user_id
    ), '[]'::jsonb),
    'evidenceProvenance', coalesce((
      select jsonb_agg(to_jsonb(assertion) order by assertion.created_at, assertion.id)
      from public.evidence_assertions assertion
      join public.buyer_sessions buyer on buyer.id = assertion.buyer_session_id
      where buyer.user_id = p_user_id
    ), '[]'::jsonb),
    'sessionShortlist', coalesce((
      select jsonb_agg(to_jsonb(item) order by item.created_at, item.property_id)
      from public.buyer_shortlist_items item
      join public.buyer_sessions buyer on buyer.id = item.buyer_session_id
      where buyer.user_id = p_user_id
    ), '[]'::jsonb),
    'conversations', coalesce((
      select jsonb_agg(to_jsonb(conversation) order by conversation.started_at, conversation.id)
      from public.conversation_sessions conversation
      where conversation.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = conversation.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb),
    'conversationMessages', coalesce((
      select jsonb_agg(to_jsonb(message) order by message.created_at, message.id)
      from public.conversation_messages message
      join public.conversation_sessions conversation on conversation.id = message.session_id
      where conversation.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = conversation.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb),
    'toolRuns', coalesce((
      select jsonb_agg(to_jsonb(tool) order by tool.created_at, tool.id)
      from public.tool_runs tool
      where tool.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = tool.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb),
    'inquiries', coalesce((
      select jsonb_agg(to_jsonb(inquiry) order by inquiry.created_at, inquiry.id)
      from public.inquiries inquiry
      where inquiry.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = inquiry.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb),
    'consentEvidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'inquiryId', inquiry.id,
        'purpose', inquiry.consent_purpose,
        'policyVersion', inquiry.consent_policy_version,
        'destination', inquiry.consent_destination,
        'consentedAt', inquiry.consent_at
      ) order by inquiry.consent_at, inquiry.id)
      from public.inquiries inquiry
      where inquiry.user_id = p_user_id
        or exists (
          select 1 from public.buyer_sessions buyer
          where buyer.id = inquiry.buyer_session_id and buyer.user_id = p_user_id
        )
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.export_authenticated_buyer_data(uuid) from public, anon;
grant execute on function public.export_authenticated_buyer_data(uuid) to authenticated;

create or replace function public.export_anonymous_buyer_data(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer_id uuid;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid buyer token' using errcode = '22023';
  end if;
  select buyer.id into buyer_id
  from public.buyer_sessions buyer
  where buyer.token_hash = p_token_hash
    and buyer.user_id is null
    and buyer.revoked_at is null
    and buyer.expires_at > now();

  return jsonb_build_object(
    'exportVersion', 'rama-buyer-export/1.0',
    'generatedAt', now(),
    'ownerType', 'anonymous',
    'buyerSession', (
      select to_jsonb(buyer) - 'token_hash'
      from public.buyer_sessions buyer where buyer.id = buyer_id
    ),
    'searchRuns', coalesce((
      select jsonb_agg(to_jsonb(run) order by run.created_at, run.id)
      from public.search_runs run where run.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'searchCandidates', coalesce((
      select jsonb_agg(to_jsonb(candidate) order by candidate.search_run_id, candidate.rank, candidate.property_id)
      from public.search_candidates candidate
      join public.search_runs run on run.id = candidate.search_run_id
      where run.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'decisionLedger', coalesce((
      select jsonb_agg(to_jsonb(event) order by event.occurred_at, event.id)
      from public.decision_ledger_events event where event.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'evidenceProvenance', coalesce((
      select jsonb_agg(to_jsonb(assertion) order by assertion.created_at, assertion.id)
      from public.evidence_assertions assertion where assertion.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'sessionShortlist', coalesce((
      select jsonb_agg(to_jsonb(item) order by item.created_at, item.property_id)
      from public.buyer_shortlist_items item where item.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'conversations', coalesce((
      select jsonb_agg(to_jsonb(conversation) order by conversation.started_at, conversation.id)
      from public.conversation_sessions conversation where conversation.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'conversationMessages', coalesce((
      select jsonb_agg(to_jsonb(message) order by message.created_at, message.id)
      from public.conversation_messages message
      join public.conversation_sessions conversation on conversation.id = message.session_id
      where conversation.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'toolRuns', coalesce((
      select jsonb_agg(to_jsonb(tool) order by tool.created_at, tool.id)
      from public.tool_runs tool where tool.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'inquiries', coalesce((
      select jsonb_agg(to_jsonb(inquiry) order by inquiry.created_at, inquiry.id)
      from public.inquiries inquiry where inquiry.buyer_session_id = buyer_id
    ), '[]'::jsonb),
    'consentEvidence', coalesce((
      select jsonb_agg(jsonb_build_object(
        'inquiryId', inquiry.id,
        'purpose', inquiry.consent_purpose,
        'policyVersion', inquiry.consent_policy_version,
        'destination', inquiry.consent_destination,
        'consentedAt', inquiry.consent_at
      ) order by inquiry.consent_at, inquiry.id)
      from public.inquiries inquiry where inquiry.buyer_session_id = buyer_id
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.export_anonymous_buyer_data(text) from public, anon, authenticated;
grant execute on function public.export_anonymous_buyer_data(text) to service_role;

create or replace function public.delete_authenticated_buyer_data(
  p_user_id uuid,
  p_confirmation text,
  p_authorization_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  actor_session_id uuid := nullif(auth.jwt() ->> 'session_id', '')::uuid;
  authorization_count integer := 0;
  request_id uuid := gen_random_uuid();
  buyer_ids uuid[] := '{}';
  inquiry_ids uuid[] := '{}';
  destinations jsonb := '[]'::jsonb;
  retained_audit_count integer := 0;
  deleted_inquiries integer := 0;
  deleted_sessions integer := 0;
  deleted_runs integer := 0;
  deleted_conversations integer := 0;
  deleted_tools integer := 0;
  deleted_briefs integer := 0;
  deleted_shortlist integer := 0;
  deleted_profiles integer := 0;
  request_counts jsonb;
begin
  if actor_id is null or actor_id is distinct from p_user_id then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_confirmation <> 'DELETE MY RAMA DATA' then
    raise exception 'Deletion confirmation does not match' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.organization_memberships membership where membership.user_id = p_user_id
  ) or exists (
    select 1 from public.organizations organization where organization.created_by = p_user_id
  ) or exists (
    select 1 from public.organization_memberships membership where membership.invited_by = p_user_id
  ) or exists (
    select 1 from public.developments development
    where development.created_by = p_user_id or development.updated_by = p_user_id
  ) or exists (
    select 1 from public.properties property
    where property.created_by = p_user_id or property.updated_by = p_user_id
  ) or exists (
    select 1 from public.payment_plans plan
    where plan.created_by = p_user_id or plan.updated_by = p_user_id
  ) or exists (
    select 1 from public.floor_plans floor_plan
    where floor_plan.created_by = p_user_id or floor_plan.updated_by = p_user_id
  ) or exists (
    select 1 from public.content_entries content
    where content.created_by = p_user_id or content.updated_by = p_user_id
  ) or exists (
    select 1 from public.property_documents document
    where document.created_by = p_user_id or document.updated_by = p_user_id
  ) or exists (
    select 1 from public.inquiries inquiry where inquiry.assigned_to = p_user_id
  ) or exists (
    select 1 from public.audit_events event where event.actor_user_id = p_user_id
  ) or exists (
    select 1 from public.advisor_evidence_feedback feedback where feedback.created_by = p_user_id
  ) then
    raise exception 'Staff account deletion requires administrator review' using errcode = '55000';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('buyer-data-erasure-global', 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('authenticated-deletion:' || p_user_id::text, 0)
  );

  update private.buyer_deletion_authorizations authz
  set consumed_at = now()
  where authz.authorization_hash = p_authorization_hash
    and authz.user_id = p_user_id
    and authz.session_id = actor_session_id
    and authz.consumed_at is null
    and authz.expires_at > now();
  get diagnostics authorization_count = row_count;

  if authorization_count <> 1 then
    raise exception 'Fresh deletion verification required' using errcode = '42501';
  end if;

  insert into private.data_rights_requests (
    id, subject_hash, request_type, status
  ) values (
    request_id, md5(p_user_id::text), 'authenticated_deletion', 'processing'
  );

  select coalesce(array_agg(buyer.id), '{}') into buyer_ids
  from public.buyer_sessions buyer where buyer.user_id = p_user_id;

  select coalesce(array_agg(inquiry.id), '{}') into inquiry_ids
  from public.inquiries inquiry
  where inquiry.user_id = p_user_id
    or inquiry.buyer_session_id = any (buyer_ids);

  select coalesce(jsonb_agg(destination order by destination), '[]'::jsonb) into destinations
  from (
    select distinct inquiry.consent_destination as destination
    from public.inquiries inquiry
    where inquiry.id = any (inquiry_ids)
      and nullif(btrim(inquiry.consent_destination), '') is not null
  ) processor_destinations;

  insert into private.processor_deletion_outbox (
    request_id, destination, resource_type, resource_reference, resource_hash
  )
  select request_id, inquiry.consent_destination, 'inquiry', inquiry.id, md5(inquiry.id::text)
  from public.inquiries inquiry
  where inquiry.id = any (inquiry_ids)
    and nullif(btrim(inquiry.consent_destination), '') is not null
  on conflict do nothing;

  delete from public.audit_events event
  where event.entity_type = 'inquiry'
    and event.entity_id = any (select inquiry_id::text from unnest(inquiry_ids) inquiry_id)
    and event.created_at <= now() - interval '24 months';

  update public.audit_events event
  set entity_id = md5(event.entity_id),
      actor_user_id = null,
      before_state = null,
      after_state = jsonb_strip_nulls(jsonb_build_object(
        'status', event.after_state -> 'status',
        'consent_policy_version', event.after_state -> 'consent_policy_version'
      ))
  where event.entity_type = 'inquiry'
    and event.entity_id = any (select inquiry_id::text from unnest(inquiry_ids) inquiry_id);
  get diagnostics retained_audit_count = row_count;

  delete from public.inquiries inquiry
  where inquiry.id = any (inquiry_ids);
  get diagnostics deleted_inquiries = row_count;

  delete from public.tool_runs tool where tool.user_id = p_user_id;
  get diagnostics deleted_tools = row_count;
  delete from public.search_runs run where run.user_id = p_user_id;
  get diagnostics deleted_runs = row_count;
  delete from public.conversation_sessions conversation where conversation.user_id = p_user_id;
  get diagnostics deleted_conversations = row_count;
  delete from public.buyer_sessions buyer where buyer.id = any (buyer_ids);
  get diagnostics deleted_sessions = row_count;
  delete from public.search_briefs brief where brief.user_id = p_user_id;
  get diagnostics deleted_briefs = row_count;
  delete from public.shortlist_items item where item.user_id = p_user_id;
  get diagnostics deleted_shortlist = row_count;
  delete from public.profiles profile where profile.id = p_user_id;
  get diagnostics deleted_profiles = row_count;

  request_counts := jsonb_build_object(
    'inquiries', deleted_inquiries,
    'buyerSessions', deleted_sessions,
    'directSearchRuns', deleted_runs,
    'directConversations', deleted_conversations,
    'directToolRuns', deleted_tools,
    'savedBriefs', deleted_briefs,
    'savedShortlist', deleted_shortlist,
    'profiles', deleted_profiles
  );

  update private.data_rights_requests
  set status = case when jsonb_array_length(destinations) > 0 then 'processor_pending' else 'completed' end,
      result_counts = request_counts,
      completed_at = case when jsonb_array_length(destinations) > 0 then null else now() end,
      expires_at = case when jsonb_array_length(destinations) > 0 then expires_at else now() + interval '24 months' end
  where id = request_id;

  return jsonb_build_object(
    'requestId', request_id,
    'applicationDataDeleted', true,
    'authUserDeletionRequired', true,
    'deleted', request_counts,
    'externalDeletionRequired', destinations,
    'retainedExceptions', jsonb_build_array(
      jsonb_build_object(
        'category', 'privacy_request_audit',
        'count', 1,
        'reason', 'Pseudonymized proof of the privacy request is retained for operational accountability.',
        'expiresAt', now() + interval '24 months'
      )
    ) || case when retained_audit_count > 0 then jsonb_build_array(
      jsonb_build_object(
        'category', 'organization_handoff_audit',
        'count', retained_audit_count,
        'reason', 'Minimized and pseudonymized consent-policy evidence is retained for the existing audit window.',
        'expiresAt', now() + interval '24 months'
      )
    ) else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.delete_authenticated_buyer_data(uuid, text, text) from public, anon;
grant execute on function public.delete_authenticated_buyer_data(uuid, text, text) to authenticated;

create or replace function public.delete_anonymous_buyer_data(
  p_token_hash text,
  p_confirmation text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid := gen_random_uuid();
  buyer_id uuid;
  inquiry_ids uuid[] := '{}';
  destinations jsonb := '[]'::jsonb;
  retained_audit_count integer := 0;
  deleted_inquiries integer := 0;
  deleted_sessions integer := 0;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid buyer token' using errcode = '22023';
  end if;
  if p_confirmation <> 'DELETE MY RAMA DATA' then
    raise exception 'Deletion confirmation does not match' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('buyer-data-erasure-global', 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('anonymous-deletion:' || p_token_hash, 0)
  );

  select buyer.id into buyer_id
  from public.buyer_sessions buyer
  where buyer.token_hash = p_token_hash
    and buyer.user_id is null
    and buyer.revoked_at is null
    and buyer.expires_at > now()
  for update;

  insert into private.data_rights_requests (
    id, subject_hash, request_type, status
  ) values (
    request_id, md5(p_token_hash), 'anonymous_deletion', 'processing'
  );

  if buyer_id is not null then
    select coalesce(array_agg(inquiry.id), '{}') into inquiry_ids
    from public.inquiries inquiry where inquiry.buyer_session_id = buyer_id;

    select coalesce(jsonb_agg(destination order by destination), '[]'::jsonb) into destinations
    from (
      select distinct inquiry.consent_destination as destination
      from public.inquiries inquiry
      where inquiry.id = any (inquiry_ids)
        and nullif(btrim(inquiry.consent_destination), '') is not null
    ) processor_destinations;

    insert into private.processor_deletion_outbox (
      request_id, destination, resource_type, resource_reference, resource_hash
    )
    select request_id, inquiry.consent_destination, 'inquiry', inquiry.id, md5(inquiry.id::text)
    from public.inquiries inquiry
    where inquiry.id = any (inquiry_ids)
      and nullif(btrim(inquiry.consent_destination), '') is not null
    on conflict do nothing;

    delete from public.audit_events event
    where event.entity_type = 'inquiry'
      and event.entity_id = any (select inquiry_id::text from unnest(inquiry_ids) inquiry_id)
      and event.created_at <= now() - interval '24 months';
    update public.audit_events event
    set entity_id = md5(event.entity_id),
        actor_user_id = null,
        before_state = null,
        after_state = jsonb_strip_nulls(jsonb_build_object(
          'status', event.after_state -> 'status',
          'consent_policy_version', event.after_state -> 'consent_policy_version'
        ))
    where event.entity_type = 'inquiry'
      and event.entity_id = any (select inquiry_id::text from unnest(inquiry_ids) inquiry_id);
    get diagnostics retained_audit_count = row_count;

    delete from public.inquiries inquiry where inquiry.id = any (inquiry_ids);
    get diagnostics deleted_inquiries = row_count;
    delete from public.buyer_sessions buyer where buyer.id = buyer_id;
    get diagnostics deleted_sessions = row_count;
  end if;

  update private.data_rights_requests
  set status = case when jsonb_array_length(destinations) > 0 then 'processor_pending' else 'completed' end,
      result_counts = jsonb_build_object('inquiries', deleted_inquiries, 'buyerSessions', deleted_sessions),
      completed_at = case when jsonb_array_length(destinations) > 0 then null else now() end,
      expires_at = case when jsonb_array_length(destinations) > 0 then expires_at else now() + interval '24 months' end
  where id = request_id;

  return jsonb_build_object(
    'requestId', request_id,
    'applicationDataDeleted', true,
    'authUserDeletionRequired', false,
    'deleted', jsonb_build_object('inquiries', deleted_inquiries, 'buyerSessions', deleted_sessions),
    'externalDeletionRequired', destinations,
    'retainedExceptions', jsonb_build_array(
      jsonb_build_object(
        'category', 'privacy_request_audit',
        'count', 1,
        'reason', 'Pseudonymized proof of the privacy request is retained for operational accountability.',
        'expiresAt', now() + interval '24 months'
      )
    ) || case when retained_audit_count > 0 then jsonb_build_array(
      jsonb_build_object(
        'category', 'organization_handoff_audit',
        'count', retained_audit_count,
        'reason', 'Minimized and pseudonymized consent-policy evidence is retained for the existing audit window.',
        'expiresAt', now() + interval '24 months'
      )
    ) else '[]'::jsonb end
  );
end;
$$;

revoke all on function public.delete_anonymous_buyer_data(text, text) from public, anon, authenticated;
grant execute on function public.delete_anonymous_buyer_data(text, text) to service_role;

create or replace function public.enforce_buyer_data_retention(
  p_apply boolean default false,
  p_as_of timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  run_id uuid := gen_random_uuid();
  retention_request_id uuid := gen_random_uuid();
  eligible_inquiries integer := 0;
  eligible_authenticated_sessions integer := 0;
  eligible_anonymous_sessions integer := 0;
  eligible_briefs integer := 0;
  eligible_shortlist integer := 0;
  deleted_inquiries integer := 0;
  deleted_authenticated_sessions integer := 0;
  deleted_anonymous_sessions integer := 0;
  deleted_briefs integer := 0;
  deleted_shortlist integer := 0;
  deleted_direct_runs integer := 0;
  deleted_direct_conversations integer := 0;
  deleted_direct_tools integer := 0;
  result_counts jsonb;
begin
  if p_as_of > now() + interval '5 minutes' then
    raise exception 'Retention as-of time cannot be in the future' using errcode = '22023';
  end if;

  select count(*) into eligible_inquiries
  from public.inquiries inquiry
  where inquiry.updated_at < p_as_of - interval '24 months';
  select count(*) into eligible_authenticated_sessions
  from public.buyer_sessions buyer
  where buyer.user_id is not null and buyer.last_seen_at < p_as_of - interval '12 months';
  select count(*) into eligible_anonymous_sessions
  from public.buyer_sessions buyer
  where buyer.user_id is null
    and buyer.last_seen_at < p_as_of - interval '30 days'
    and not exists (select 1 from public.inquiries inquiry where inquiry.buyer_session_id = buyer.id);
  select count(*) into eligible_briefs
  from public.search_briefs brief where brief.created_at < p_as_of - interval '12 months';
  select count(*) into eligible_shortlist
  from public.shortlist_items item where item.created_at < p_as_of - interval '12 months';

  if p_apply then
    -- Serialize all repository-owned erasure producers. This prevents retention
    -- from enqueueing the same external resource while a buyer deletion is
    -- concurrently preparing its processor work under a different request id.
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended('buyer-data-erasure-global', 0)
    );

    insert into private.processor_deletion_outbox (
      request_id, destination, resource_type, resource_reference, resource_hash
    )
    select retention_request_id, inquiry.consent_destination, 'inquiry', inquiry.id, md5(inquiry.id::text)
    from public.inquiries inquiry
    where inquiry.updated_at < p_as_of - interval '24 months'
      and nullif(btrim(inquiry.consent_destination), '') is not null
    on conflict do nothing;

    delete from public.audit_events event
    where event.entity_type = 'inquiry'
      and event.created_at < p_as_of - interval '24 months';
    delete from public.inquiries inquiry
    where inquiry.updated_at < p_as_of - interval '24 months';
    get diagnostics deleted_inquiries = row_count;

    delete from public.search_briefs brief
    where brief.created_at < p_as_of - interval '12 months';
    get diagnostics deleted_briefs = row_count;
    delete from public.shortlist_items item
    where item.created_at < p_as_of - interval '12 months';
    get diagnostics deleted_shortlist = row_count;
    delete from public.tool_runs tool
    where tool.user_id is not null
      and tool.buyer_session_id is null
      and tool.created_at < p_as_of - interval '12 months';
    get diagnostics deleted_direct_tools = row_count;
    delete from public.search_runs run
    where run.user_id is not null
      and run.buyer_session_id is null
      and run.created_at < p_as_of - interval '12 months';
    get diagnostics deleted_direct_runs = row_count;
    delete from public.conversation_sessions conversation
    where conversation.user_id is not null
      and conversation.buyer_session_id is null
      and conversation.started_at < p_as_of - interval '12 months';
    get diagnostics deleted_direct_conversations = row_count;
    delete from public.buyer_sessions buyer
    where buyer.user_id is not null
      and buyer.last_seen_at < p_as_of - interval '12 months';
    get diagnostics deleted_authenticated_sessions = row_count;
    delete from public.buyer_sessions buyer
    where buyer.user_id is null
      and buyer.last_seen_at < p_as_of - interval '30 days'
      and not exists (select 1 from public.inquiries inquiry where inquiry.buyer_session_id = buyer.id);
    get diagnostics deleted_anonymous_sessions = row_count;

    delete from private.buyer_session_token_tombstones tombstone where tombstone.expires_at < p_as_of;
    delete from private.processor_deletion_outbox deletion
    where deletion.status in ('delivered', 'not_required')
      and deletion.completed_at is not null
      and deletion.completed_at < p_as_of - interval '24 months';
    delete from private.buyer_deletion_challenges challenge where challenge.expires_at < p_as_of;
    delete from private.buyer_deletion_authorizations authz
    where authz.expires_at < p_as_of;
    delete from private.data_rights_requests request
    where request.status = 'completed'
      and request.completed_at is not null
      and request.completed_at < p_as_of - interval '24 months';
    delete from private.data_retention_runs retention where retention.expires_at < p_as_of;
  end if;

  result_counts := jsonb_build_object(
    'eligible', jsonb_build_object(
      'inquiries', eligible_inquiries,
      'authenticatedBuyerSessions', eligible_authenticated_sessions,
      'anonymousBuyerSessions', eligible_anonymous_sessions,
      'savedBriefs', eligible_briefs,
      'savedShortlist', eligible_shortlist
    ),
    'deleted', jsonb_build_object(
      'inquiries', deleted_inquiries,
      'authenticatedBuyerSessions', deleted_authenticated_sessions,
      'anonymousBuyerSessions', deleted_anonymous_sessions,
      'savedBriefs', deleted_briefs,
      'savedShortlist', deleted_shortlist,
      'directSearchRuns', deleted_direct_runs,
      'directConversations', deleted_direct_conversations,
      'directToolRuns', deleted_direct_tools
    )
  );

  insert into private.data_retention_runs (
    id, as_of, mode, status, result_counts
  ) values (
    run_id, p_as_of, case when p_apply then 'apply' else 'dry_run' end, 'completed', result_counts
  );

  return jsonb_build_object(
    'runId', run_id,
    'mode', case when p_apply then 'apply' else 'dry_run' end,
    'asOf', p_as_of,
    'counts', result_counts
  );
end;
$$;

revoke all on function public.enforce_buyer_data_retention(boolean, timestamptz)
  from public, anon, authenticated;
grant execute on function public.enforce_buyer_data_retention(boolean, timestamptz)
  to service_role;
