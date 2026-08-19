-- Rotate opaque buyer tokens without changing the stable buyer-session owner.
-- Tombstones prevent delayed tabs from recreating a retired token through the
-- create-if-missing branch in persist_buyer_search.

create table if not exists private.buyer_session_token_tombstones (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  buyer_session_id uuid not null,
  reason text not null check (reason in ('login', 'oauth', 'handoff', 'password_change', 'signout', 'user_mismatch')),
  rotated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint buyer_session_token_tombstones_expiry check (expires_at > rotated_at)
);
create index if not exists buyer_session_token_tombstones_expiry_idx
  on private.buyer_session_token_tombstones (expires_at);
revoke all on private.buyer_session_token_tombstones from public, anon, authenticated;

create or replace function private.rotate_buyer_session_locked(
  p_current_token_hash text,
  p_next_token_hash text,
  p_user_id uuid,
  p_mode text,
  p_ttl_seconds integer,
  p_reason text
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  session_row public.buyer_sessions%rowtype;
  preserve_session boolean := true;
begin
  if p_current_token_hash !~ '^[a-f0-9]{64}$'
    or p_next_token_hash !~ '^[a-f0-9]{64}$'
    or p_current_token_hash = p_next_token_hash
  then raise exception 'Invalid buyer token rotation' using errcode = '22023'; end if;
  if p_mode not in ('rotate', 'bind', 'revoke') then
    raise exception 'Invalid buyer token rotation mode' using errcode = '22023';
  end if;
  if p_mode = 'bind' and p_user_id is null then
    raise exception 'Buyer token bind requires a user' using errcode = '22023';
  end if;
  if p_ttl_seconds not between 3600 and 7776000 then
    raise exception 'Invalid buyer session TTL' using errcode = '22023';
  end if;
  if p_reason not in ('login', 'oauth', 'handoff', 'password_change', 'signout') then
    raise exception 'Invalid buyer token rotation reason' using errcode = '22023';
  end if;

  select * into session_row
  from public.buyer_sessions
  where token_hash = p_current_token_hash
    and revoked_at is null
    and expires_at > now()
  for update;

  if not found then
    if exists (
      select 1 from private.buyer_session_token_tombstones tombstone
      where tombstone.token_hash = p_current_token_hash
        and tombstone.expires_at > now()
    ) then
      raise exception 'Buyer token has been retired' using errcode = '42501';
    end if;
    if p_mode = 'bind' then
      if exists (
        select 1 from public.buyer_sessions session where session.token_hash = p_next_token_hash
      ) or exists (
        select 1 from private.buyer_session_token_tombstones tombstone
        where tombstone.token_hash = p_next_token_hash and tombstone.expires_at > now()
      ) then
        raise exception 'Next buyer token is unavailable' using errcode = '23505';
      end if;
      insert into public.buyer_sessions (token_hash, user_id, expires_at)
      values (p_next_token_hash, p_user_id, now() + make_interval(secs => p_ttl_seconds))
      returning * into session_row;
      return jsonb_build_object('preserved', false, 'buyerSessionId', session_row.id);
    end if;
    return jsonb_build_object('preserved', false, 'buyerSessionId', null);
  end if;

  if exists (
    select 1 from private.buyer_session_token_tombstones tombstone
    where tombstone.token_hash = p_next_token_hash
      and tombstone.expires_at > now()
  ) or exists (
    select 1 from public.buyer_sessions session
    where session.token_hash = p_next_token_hash
      and session.id <> session_row.id
  ) then
    raise exception 'Next buyer token is unavailable' using errcode = '23505';
  end if;

  if p_mode = 'revoke' or (
    p_mode = 'bind'
    and session_row.user_id is not null
    and session_row.user_id <> p_user_id
  ) then
    preserve_session := false;
  end if;

  insert into private.buyer_session_token_tombstones (
    token_hash, buyer_session_id, reason, expires_at
  ) values (
    p_current_token_hash,
    session_row.id,
    case when preserve_session then p_reason else case when p_mode = 'revoke' then 'signout' else 'user_mismatch' end end,
    greatest(session_row.expires_at, now() + interval '5 minutes')
  )
  on conflict (token_hash) do update
    set expires_at = greatest(private.buyer_session_token_tombstones.expires_at, excluded.expires_at);

  if preserve_session then
    update public.buyer_sessions
    set token_hash = p_next_token_hash,
        user_id = case when p_mode = 'bind' then p_user_id else user_id end,
        last_seen_at = now(),
        expires_at = now() + make_interval(secs => p_ttl_seconds)
    where id = session_row.id;
  else
    update public.buyer_sessions
    set revoked_at = now(), last_seen_at = now()
    where id = session_row.id;
    if p_mode = 'bind' then
      insert into public.buyer_sessions (token_hash, user_id, expires_at)
      values (p_next_token_hash, p_user_id, now() + make_interval(secs => p_ttl_seconds))
      returning * into session_row;
    end if;
  end if;

  return jsonb_build_object(
    'preserved', preserve_session,
    'buyerSessionId', case when preserve_session or p_mode = 'bind' then session_row.id else null end
  );
end;
$$;
revoke all on function private.rotate_buyer_session_locked(text, text, uuid, text, integer, text)
  from public, anon, authenticated;

create or replace function public.rotate_buyer_session(
  p_current_token_hash text,
  p_next_token_hash text,
  p_user_id uuid default null,
  p_mode text default 'rotate',
  p_ttl_seconds integer default 2592000,
  p_reason text default 'login'
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select private.rotate_buyer_session_locked(
    p_current_token_hash,
    p_next_token_hash,
    p_user_id,
    p_mode,
    p_ttl_seconds,
    p_reason
  );
$$;
revoke all on function public.rotate_buyer_session(text, text, uuid, text, integer, text)
  from public, anon, authenticated;
grant execute on function public.rotate_buyer_session(text, text, uuid, text, integer, text)
  to service_role;

create or replace function public.persist_buyer_search(
  p_token_hash text,
  p_source text,
  p_raw_brief text,
  p_normalized_criteria jsonb,
  p_candidates jsonb,
  p_correlation_id uuid,
  p_model text default null,
  p_ttl_seconds integer default 2592000
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer_id uuid;
  conversation_id uuid;
  run_id uuid;
  candidate jsonb;
  candidate_rank integer := 0;
  inserted_count integer := 0;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid buyer token hash'; end if;
  if p_source not in ('text','voice') then raise exception 'Invalid search source'; end if;
  if char_length(p_raw_brief) not between 3 and 500 then raise exception 'Invalid buyer brief'; end if;
  if p_ttl_seconds not between 3600 and 7776000 then raise exception 'Invalid buyer session TTL'; end if;
  if jsonb_typeof(p_candidates) <> 'array' or jsonb_array_length(p_candidates) > 12 then raise exception 'Invalid candidate set'; end if;

  select id into buyer_id from public.buyer_sessions
  where token_hash = p_token_hash and revoked_at is null and expires_at > now()
  for update;
  if buyer_id is null then
    if exists (
      select 1 from private.buyer_session_token_tombstones tombstone
      where tombstone.token_hash = p_token_hash
        and tombstone.expires_at > now()
    ) then
      raise exception 'Buyer token has been retired' using errcode = '42501';
    end if;
    insert into public.buyer_sessions (token_hash, expires_at)
    values (p_token_hash, now() + make_interval(secs => p_ttl_seconds))
    on conflict (token_hash) do nothing
    returning id into buyer_id;
    if buyer_id is null then
      select id into buyer_id from public.buyer_sessions
      where token_hash = p_token_hash and revoked_at is null and expires_at > now()
      for update;
      if buyer_id is null then
        raise exception 'Buyer token is unavailable' using errcode = '42501';
      end if;
    end if;
  else
    update public.buyer_sessions set last_seen_at = now() where id = buyer_id;
  end if;

  select id into conversation_id from public.conversation_sessions
  where buyer_session_id = buyer_id and status = 'active'
  order by started_at desc limit 1;
  if conversation_id is null then
    insert into public.conversation_sessions (buyer_session_id, status, channel, model)
    values (buyer_id, 'active', 'web', p_model)
    returning id into conversation_id;
  end if;

  insert into public.search_runs (buyer_session_id, conversation_id, source, raw_brief, normalized_criteria, correlation_id, status)
  values (buyer_id, conversation_id, p_source, p_raw_brief, p_normalized_criteria, p_correlation_id, 'completed')
  returning id into run_id;

  for candidate in select value from jsonb_array_elements(p_candidates)
  loop
    candidate_rank := candidate_rank + 1;
    insert into public.search_candidates (
      search_run_id, property_id, rank, score, reasons, property_version, source_observed_at, fact_snapshot
    )
    select
      run_id,
      property.id,
      candidate_rank,
      least(1, greatest(0, coalesce((candidate ->> 'score')::numeric, 0))),
      coalesce(array(select jsonb_array_elements_text(coalesce(candidate -> 'reasons', '[]'::jsonb))), '{}'),
      property.version,
      property.source_updated_at,
      jsonb_build_object(
        'name', property.name,
        'location', property.location,
        'priceAed', property.price_aed,
        'availability', property.availability_status,
        'sourceName', property.source_name,
        'sourceObservedAt', property.source_updated_at,
        'version', property.version
      )
    from public.public_property_catalog property
    where property.id = candidate ->> 'propertyId';
    if found then inserted_count := inserted_count + 1; end if;
  end loop;

  update public.search_runs set result_count = inserted_count where id = run_id;
  return jsonb_build_object('buyerSessionId', buyer_id, 'conversationId', conversation_id, 'searchRunId', run_id, 'resultCount', inserted_count);
end;
$$;
revoke all on function public.persist_buyer_search(text, text, text, jsonb, jsonb, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.persist_buyer_search(text, text, text, jsonb, jsonb, uuid, text, integer)
  to service_role;

drop function if exists public.create_buyer_inquiry(text, uuid, text, text, text, text, text, text, text, text, text, uuid);
create function public.create_buyer_inquiry(
  p_token_hash text,
  p_next_token_hash text,
  p_search_run_id uuid,
  p_property_id text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_consent_purpose text,
  p_policy_version text,
  p_destination text,
  p_idempotency_key text,
  p_correlation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  buyer_id uuid;
  retired_buyer_id uuid;
  conversation_id uuid;
  organization_id uuid;
  inquiry_id uuid;
begin
  select id into buyer_id from public.buyer_sessions
  where token_hash = p_token_hash and revoked_at is null and expires_at > now()
  for update;
  if buyer_id is null then
    select tombstone.buyer_session_id into retired_buyer_id
    from private.buyer_session_token_tombstones tombstone
    where tombstone.token_hash = p_token_hash and tombstone.expires_at > now();
    if retired_buyer_id is null then
      raise exception 'Buyer session not found' using errcode = '42501';
    end if;
    select inquiry.id into inquiry_id
    from public.inquiries inquiry
    where inquiry.buyer_session_id = retired_buyer_id
      and inquiry.idempotency_key = p_idempotency_key
      and inquiry.search_run_id = p_search_run_id
      and inquiry.property_id = p_property_id;
    if inquiry_id is null then
      raise exception 'Retired buyer token cannot create an inquiry' using errcode = '42501';
    end if;
    select id into buyer_id from public.buyer_sessions
    where id = retired_buyer_id
      and token_hash = p_next_token_hash
      and revoked_at is null
      and expires_at > now()
    for update;
    if buyer_id is null then
      raise exception 'Buyer inquiry retry token is unavailable' using errcode = '42501';
    end if;
    return inquiry_id;
  end if;
  select run.conversation_id into conversation_id from public.search_runs run
  where run.id = p_search_run_id and run.buyer_session_id = buyer_id;
  if not found then raise exception 'Search run not found' using errcode = '42501'; end if;
  select property.organization_id into organization_id from public.public_property_catalog property
  where property.id = p_property_id and property.organization_id is not null;
  if organization_id is null then raise exception 'Property is not eligible for advisor handoff' using errcode = '23514'; end if;
  if not exists (
    select 1 from public.search_candidates candidate
    where candidate.search_run_id = p_search_run_id and candidate.property_id = p_property_id
  ) then raise exception 'Property was not part of this buyer search' using errcode = '23514'; end if;
  if char_length(btrim(p_full_name)) not between 2 and 120
    or (nullif(btrim(p_email), '') is null and nullif(btrim(p_phone), '') is null)
    or char_length(btrim(p_consent_purpose)) < 3
    or char_length(btrim(p_policy_version)) < 1
    or char_length(btrim(p_destination)) < 2
    or char_length(btrim(p_idempotency_key)) not between 16 and 128
  then raise exception 'Invalid inquiry payload' using errcode = '23514'; end if;

  insert into public.inquiries (
    organization_id, buyer_session_id, property_id, session_id, search_run_id,
    full_name, email, phone, message, consent_at, consent_purpose,
    consent_policy_version, consent_destination, idempotency_key,
    status, assigned_to, correlation_id
  ) values (
    organization_id, buyer_id, p_property_id, conversation_id, p_search_run_id,
    btrim(p_full_name), nullif(btrim(p_email), ''), nullif(btrim(p_phone), ''), nullif(btrim(p_message), ''),
    now(), p_consent_purpose, p_policy_version, p_destination, p_idempotency_key,
    'new', null, p_correlation_id
  )
  on conflict (buyer_session_id, idempotency_key) where buyer_session_id is not null and idempotency_key is not null
  do update set updated_at = public.inquiries.updated_at
  returning id into inquiry_id;

  insert into public.audit_events (organization_id, action, entity_type, entity_id, after_state, correlation_id)
  select organization_id, 'inquiry.created', 'inquiry', inquiry_id::text,
    jsonb_build_object('property_id', p_property_id, 'status', 'new', 'consent_policy_version', p_policy_version),
    p_correlation_id
  where not exists (
    select 1 from public.audit_events event
    where event.entity_type = 'inquiry' and event.entity_id = inquiry_id::text and event.action = 'inquiry.created'
  );
  insert into public.crm_outbox (organization_id, inquiry_id, event_type, payload)
  values (organization_id, inquiry_id, 'inquiry.created', jsonb_build_object('inquiryId', inquiry_id, 'propertyId', p_property_id))
  on conflict (inquiry_id, event_type) do nothing;

  perform private.rotate_buyer_session_locked(
    p_token_hash,
    p_next_token_hash,
    null,
    'rotate',
    2592000,
    'handoff'
  );
  return inquiry_id;
end;
$$;
revoke all on function public.create_buyer_inquiry(text, text, uuid, text, text, text, text, text, text, text, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.create_buyer_inquiry(text, text, uuid, text, text, text, text, text, text, text, text, text, uuid)
  to service_role;

create or replace function public.verify_operational_security_posture()
returns table (table_name text, rls_enabled boolean, anon_select boolean)
language sql
security definer
set search_path = ''
as $$
  select
    catalog.relname::text,
    catalog.relrowsecurity,
    has_table_privilege('anon', catalog.oid, 'SELECT')
  from pg_catalog.pg_class catalog
  join pg_catalog.pg_namespace namespace on namespace.oid = catalog.relnamespace
  where namespace.nspname = 'public'
    and catalog.relname = any (array[
      'search_briefs', 'search_runs', 'buyer_sessions',
      'tool_runs', 'inquiries', 'audit_events'
    ]::text[])
  order by catalog.relname;
$$;
revoke all on function public.verify_operational_security_posture()
  from public, anon, authenticated;
grant execute on function public.verify_operational_security_posture()
  to service_role;
