-- Repair a PL/pgSQL name collision that rolled back confirmed searches while
-- evidence-v2 writes were enabled. Keep the function service-owned and locked
-- to its empty search path.

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

revoke all on function private.capture_candidate_evidence() from public, anon, authenticated;
