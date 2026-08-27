-- A SELECT INTO with no matching idempotency row nulls every target variable.
-- Restore the candidate counter before creating the first confirmed run.

create or replace function public.persist_buyer_search(
  p_token_hash text,
  p_source text,
  p_raw_brief text,
  p_normalized_criteria jsonb,
  p_candidates jsonb,
  p_correlation_id uuid,
  p_idempotency_key text,
  p_write_evidence_v2 boolean default true,
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
  persisted_property_ids text[] := '{}';
begin
  if p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'Invalid buyer token hash'; end if;
  if p_source not in ('text','voice') then raise exception 'Invalid search source'; end if;
  if char_length(p_raw_brief) not between 3 and 500 then raise exception 'Invalid buyer brief'; end if;
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 16 and 128 then raise exception 'Invalid confirmation key'; end if;
  if p_ttl_seconds not between 3600 and 7776000 then raise exception 'Invalid buyer session TTL'; end if;
  if jsonb_typeof(p_candidates) <> 'array' or jsonb_array_length(p_candidates) > 12 then raise exception 'Invalid candidate set'; end if;
  perform pg_catalog.set_config(
    'rama.write_evidence_v2',
    case when p_write_evidence_v2 then 'true' else 'false' end,
    true
  );

  select id into buyer_id from public.buyer_sessions
  where token_hash = p_token_hash and revoked_at is null and expires_at > now()
  for update;
  if buyer_id is null then
    if exists (
      select 1 from private.buyer_session_token_tombstones tombstone
      where tombstone.token_hash = p_token_hash and tombstone.expires_at > now()
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
      if buyer_id is null then raise exception 'Buyer token is unavailable' using errcode = '42501'; end if;
    end if;
  else
    update public.buyer_sessions set last_seen_at = now() where id = buyer_id;
  end if;

  select run.id, run.conversation_id, run.result_count
  into run_id, conversation_id, inserted_count
  from public.search_runs run
  where run.buyer_session_id = buyer_id and run.confirmation_key = p_idempotency_key;
  if run_id is not null then
    select coalesce(array_agg(property_id order by rank), '{}')
    into persisted_property_ids
    from public.search_candidates
    where search_run_id = run_id;
    return jsonb_build_object('buyerSessionId', buyer_id, 'conversationId', conversation_id, 'searchRunId', run_id, 'resultCount', inserted_count, 'propertyIds', persisted_property_ids, 'reused', true);
  end if;
  inserted_count := 0;

  select id into conversation_id from public.conversation_sessions
  where buyer_session_id = buyer_id and status = 'active'
  order by started_at desc limit 1;
  if conversation_id is null then
    insert into public.conversation_sessions (buyer_session_id, status, channel, model)
    values (buyer_id, 'active', 'web', p_model)
    returning id into conversation_id;
  end if;

  insert into public.search_runs (
    buyer_session_id, conversation_id, source, raw_brief, normalized_criteria,
    correlation_id, confirmation_key, status
  ) values (
    buyer_id, conversation_id, p_source, p_raw_brief, p_normalized_criteria,
    p_correlation_id, p_idempotency_key, 'completed'
  ) returning id into run_id;

  for candidate in select value from jsonb_array_elements(p_candidates)
  loop
    candidate_rank := candidate_rank + 1;
    insert into public.search_candidates (
      search_run_id, property_id, rank, score, reasons, property_version,
      source_observed_at, fact_snapshot
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
        'currency', 'AED',
        'beds', property.beds,
        'baths', property.baths,
        'areaSqFt', property.area_sq_ft,
        'availability', property.availability_status,
        'sourceName', property.source_name,
        'sourceObservedAt', property.source_updated_at,
        'version', property.version
      )
    from public.public_property_catalog property
    where property.id = candidate ->> 'propertyId';
    if found then
      inserted_count := inserted_count + 1;
      persisted_property_ids := array_append(persisted_property_ids, candidate ->> 'propertyId');
    end if;
  end loop;

  update public.search_runs set result_count = inserted_count where id = run_id;
  return jsonb_build_object('buyerSessionId', buyer_id, 'conversationId', conversation_id, 'searchRunId', run_id, 'resultCount', inserted_count, 'propertyIds', persisted_property_ids, 'reused', false);
end;
$$;

revoke all on function public.persist_buyer_search(text, text, text, jsonb, jsonb, uuid, text, boolean, text, integer)
  from public, anon, authenticated;
grant execute on function public.persist_buyer_search(text, text, text, jsonb, jsonb, uuid, text, boolean, text, integer)
  to service_role;
