-- Expand-and-cutover foundation for immutable as-seen evidence and a durable,
-- buyer-owned Decision Ledger. No client role receives direct table access.

create table if not exists public.evidence_assertions (
  id uuid primary key default gen_random_uuid(),
  assertion_key text not null unique,
  buyer_session_id uuid not null references public.buyer_sessions(id) on delete cascade,
  search_run_id uuid not null references public.search_runs(id) on delete cascade,
  property_id text references public.properties(id) on delete set null,
  field text not null,
  state text not null,
  as_seen_value jsonb,
  source_name text,
  observed_at timestamptz,
  content_hash text not null,
  schema_version text not null default '2',
  created_at timestamptz not null default now(),
  constraint evidence_assertions_state_check check (state in (
    'source_confirmed', 'buyer_confirmed', 'inferred', 'stale', 'disputed', 'unknown'
  )),
  constraint evidence_assertions_hash_check check (content_hash ~ '^[a-f0-9]{32,64}$')
);

create index if not exists evidence_assertions_run_property_idx
  on public.evidence_assertions (search_run_id, property_id, created_at);

create table if not exists public.decision_ledger_events (
  id uuid primary key default gen_random_uuid(),
  buyer_session_id uuid not null references public.buyer_sessions(id) on delete cascade,
  search_run_id uuid not null references public.search_runs(id) on delete cascade,
  event_key text not null,
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  schema_version text not null default '1',
  constraint decision_ledger_event_type_check check (event_type in (
    'brief_confirmed', 'candidate_seen', 'criterion_revised', 'candidate_dismissed', 'open_question'
  )),
  constraint decision_ledger_event_summary_check check (char_length(summary) between 1 and 500),
  unique (buyer_session_id, event_key)
);

create index if not exists decision_ledger_events_run_time_idx
  on public.decision_ledger_events (search_run_id, occurred_at, id);

alter table public.evidence_assertions enable row level security;
alter table public.decision_ledger_events enable row level security;
revoke all on public.evidence_assertions, public.decision_ledger_events from public, anon, authenticated;
grant select, insert on public.evidence_assertions, public.decision_ledger_events to service_role;

create or replace function private.capture_confirmed_brief_ledger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(pg_catalog.current_setting('rama.write_evidence_v2', true), 'true') <> 'true' then return new; end if;
  if new.buyer_session_id is null or new.confirmation_key is null then return new; end if;
  insert into public.decision_ledger_events (
    buyer_session_id, search_run_id, event_key, event_type, summary, payload, occurred_at
  ) values (
    new.buyer_session_id,
    new.id,
    'brief-confirmed:' || new.confirmation_key,
    'brief_confirmed',
    'Buyer confirmed the written brief before discovery.',
    jsonb_build_object(
      'source', new.source,
      'criteria', new.normalized_criteria,
      'briefHash', md5(new.raw_brief)
    ),
    new.created_at
  ) on conflict (buyer_session_id, event_key) do nothing;
  return new;
end;
$$;

drop trigger if exists search_runs_capture_confirmed_brief on public.search_runs;
create trigger search_runs_capture_confirmed_brief
after insert on public.search_runs
for each row execute function private.capture_confirmed_brief_ledger();

create or replace function private.capture_candidate_evidence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer_id uuid;
  field_name text;
  source_name text;
  observed_at timestamptz;
  snapshot_hash text;
  assertion_keys jsonb := '[]'::jsonb;
  candidate_assertion_key text;
begin
  if coalesce(pg_catalog.current_setting('rama.write_evidence_v2', true), 'true') <> 'true' then return new; end if;
  select run.buyer_session_id into buyer_id from public.search_runs run where run.id = new.search_run_id;
  if buyer_id is null then return new; end if;
  source_name := new.fact_snapshot ->> 'sourceName';
  observed_at := nullif(new.fact_snapshot ->> 'sourceObservedAt', '')::timestamptz;
  snapshot_hash := md5(new.fact_snapshot::text);

  foreach field_name in array array['priceAed','availability','beds','baths','areaSqFt']
  loop
    candidate_assertion_key := new.search_run_id::text || ':' || new.property_id || ':' || field_name;
    assertion_keys := assertion_keys || jsonb_build_array(candidate_assertion_key);
    insert into public.evidence_assertions (
      assertion_key, buyer_session_id, search_run_id, property_id, field, state,
      as_seen_value, source_name, observed_at, content_hash
    ) values (
      candidate_assertion_key,
      buyer_id,
      new.search_run_id,
      new.property_id,
      field_name,
      case when new.fact_snapshot ? field_name then 'source_confirmed' else 'unknown' end,
      new.fact_snapshot -> field_name,
      source_name,
      observed_at,
      snapshot_hash
    ) on conflict (assertion_key) do nothing;
  end loop;

  insert into public.decision_ledger_events (
    buyer_session_id, search_run_id, event_key, event_type, summary, payload
  ) values (
    buyer_id,
    new.search_run_id,
    'candidate-seen:' || new.search_run_id::text || ':' || new.property_id,
    'candidate_seen',
    'A candidate entered the shortlist with an immutable as-seen snapshot.',
    jsonb_build_object('propertyId', new.property_id, 'rank', new.rank, 'assertionKeys', assertion_keys)
  ) on conflict (buyer_session_id, event_key) do nothing;
  return new;
end;
$$;

drop trigger if exists search_candidates_capture_evidence on public.search_candidates;
create trigger search_candidates_capture_evidence
after insert on public.search_candidates
for each row execute function private.capture_candidate_evidence();

create or replace function public.append_buyer_ledger_event(
  p_search_run_id uuid,
  p_event_type text,
  p_summary text,
  p_property_id text,
  p_idempotency_key text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  buyer_id uuid;
  event_id uuid;
begin
  if p_event_type not in ('criterion_revised', 'candidate_dismissed', 'open_question')
    or (p_event_type = 'candidate_dismissed' and p_property_id is null)
    or char_length(btrim(p_summary)) not between 1 and 500
    or char_length(p_idempotency_key) not between 16 and 128
  then raise exception 'Invalid ledger event' using errcode = '22023'; end if;

  select session.id into buyer_id
  from public.buyer_sessions session
  join public.search_runs run on run.buyer_session_id = session.id
  where session.user_id = auth.uid()
    and session.revoked_at is null
    and session.expires_at > now()
    and run.id = p_search_run_id;
  if buyer_id is null then raise exception 'Search run not found' using errcode = '42501'; end if;
  if p_property_id is not null and not exists (
    select 1 from public.search_candidates candidate
    where candidate.search_run_id = p_search_run_id and candidate.property_id = p_property_id
  ) then raise exception 'Candidate is not part of this search' using errcode = '42501'; end if;

  insert into public.decision_ledger_events (
    buyer_session_id, search_run_id, event_key, event_type, summary, payload
  ) values (
    buyer_id, p_search_run_id, p_idempotency_key, p_event_type, btrim(p_summary),
    jsonb_build_object('propertyId', p_property_id)
  ) on conflict (buyer_session_id, event_key) do update
    set event_key = excluded.event_key
  returning id into event_id;
  return event_id;
end;
$$;

revoke all on function public.append_buyer_ledger_event(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.append_buyer_ledger_event(uuid, text, text, text, text)
  to authenticated, service_role;

alter table public.decision_ledger_events enable row level security;

create policy "Authenticated users can insert ledger events" on public.decision_ledger_events
  for insert to authenticated
  with check (
    buyer_session_id in (
      select id from public.buyer_sessions where user_id = auth.uid()
    )
  );

create or replace function public.read_buyer_ledger_events(
  p_token_hash text,
  p_search_run_id uuid
)
returns table (
  id uuid,
  event_type text,
  summary text,
  payload jsonb,
  occurred_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select event.id, event.event_type, event.summary, event.payload, event.occurred_at
  from public.decision_ledger_events event
  join public.buyer_sessions session on session.id = event.buyer_session_id
  where event.search_run_id = p_search_run_id
    and session.token_hash = p_token_hash
    and session.revoked_at is null
    and session.expires_at > now()
  order by event.occurred_at, event.id;
$$;

revoke all on function public.read_buyer_ledger_events(text, uuid)
  from public, anon, authenticated;
grant execute on function public.read_buyer_ledger_events(text, uuid)
  to service_role;
