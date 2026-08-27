create or replace function public.publish_validated_provider_record(p_staging_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  staged public.provider_records_staging%rowtype;
  source public.provider_sources%rowtype;
  property_id text;
begin
  select * into staged from public.provider_records_staging where id = p_staging_id for update;
  if not found or staged.status <> 'validated' then raise exception 'Provider record is not validated' using errcode = '23514'; end if;
  select * into source from public.provider_sources where id = staged.provider_source_id for update;
  if not source.enabled
    or source.publication_rights_status <> 'approved'
    or source.rights_expires_at <= now()
    or staged.publication_ends_at <= now()
    or staged.source_observed_at < now() - make_interval(hours => source.maximum_freshness_hours)
    or not staged.media_rights_confirmed
  then raise exception 'Provider publication gate is closed' using errcode = '42501'; end if;
  if staged.normalized_payload is null
    or pg_catalog.jsonb_typeof(staged.normalized_payload) <> 'object'
    or char_length(btrim(staged.normalized_payload ->> 'name')) not between 2 and 160
    or char_length(btrim(staged.normalized_payload ->> 'location')) not between 2 and 160
    or char_length(btrim(staged.normalized_payload ->> 'description')) < 40
    or (staged.normalized_payload ->> 'slug') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or (staged.normalized_payload ->> 'propertyType') not in ('apartment','villa','townhouse','penthouse')
    or (staged.normalized_payload ->> 'completionStatus') not in ('off_plan','under_construction','ready')
    or (staged.normalized_payload ->> 'priceAed') !~ '^[1-9][0-9]{0,9}$'
    or staged.normalized_payload ->> 'beds' is null
    or (staged.normalized_payload ->> 'beds') !~ '^(?:[0-9]|[1-2][0-9]|30)$'
    or staged.normalized_payload ->> 'baths' is null
    or (staged.normalized_payload ->> 'baths') !~ '^(?:[0-9]|[1-2][0-9]|30)$'
    or (staged.normalized_payload ->> 'areaSqFt') !~ '^[1-9][0-9]{0,9}$'
    or (staged.normalized_payload ->> 'imageUrl') !~ '^https://'
    or char_length(btrim(staged.normalized_payload ->> 'imageAlt')) not between 2 and 300
  then raise exception 'Provider record does not satisfy the catalog contract' using errcode = '23514'; end if;

  select prior.published_property_id into property_id
  from public.provider_records_staging prior
  where prior.provider_source_id = staged.provider_source_id
    and prior.source_record_id = staged.source_record_id
    and prior.published_property_id is not null
  order by prior.published_at desc nulls last, prior.received_at desc
  limit 1;
  property_id := coalesce(staged.published_property_id, property_id, gen_random_uuid()::text);
  if exists (
    select 1 from public.properties property
    where property.id = property_id
      and property.source_updated_at >= staged.source_observed_at
  ) then
    insert into public.provider_reconciliation_events (
      provider_source_id, source_record_id, event_type, severity, details
    ) values (
      source.id, staged.source_record_id, 'stale', 'warning',
      jsonb_build_object('stagingId', staged.id, 'incomingObservedAt', staged.source_observed_at)
    );
    update public.provider_records_staging
    set status = 'rejected',
        validation_errors = validation_errors || jsonb_build_array('Out-of-order provider revision')
    where id = staged.id;
    return null;
  end if;
  perform pg_catalog.set_config('rama.provider_publication', 'on', true);
  insert into public.properties (
    id, organization_id, provider_source_id, slug, name, location, description, property_type,
    completion_status, availability_status, price_aed, beds, baths, area_sq_ft,
    feature, match_reason, image_url, image_alt, status, publication_status,
    source_name, source_updated_at, published_at, publication_ends_at, version
  ) values (
    property_id,
    source.organization_id,
    source.id,
    staged.normalized_payload ->> 'slug',
    staged.normalized_payload ->> 'name',
    staged.normalized_payload ->> 'location',
    staged.normalized_payload ->> 'description',
    staged.normalized_payload ->> 'propertyType',
    staged.normalized_payload ->> 'completionStatus',
    'available',
    (staged.normalized_payload ->> 'priceAed')::numeric,
    (staged.normalized_payload ->> 'beds')::integer,
    (staged.normalized_payload ->> 'baths')::integer,
    (staged.normalized_payload ->> 'areaSqFt')::numeric,
    coalesce(staged.normalized_payload ->> 'feature', 'Provider-published residence'),
    'Matches one or more buyer-confirmed criteria.',
    staged.normalized_payload ->> 'imageUrl',
    staged.normalized_payload ->> 'imageAlt',
    'live',
    'published',
    source.source_name,
    staged.source_observed_at,
    now(),
    least(source.rights_expires_at, staged.publication_ends_at, staged.source_observed_at + make_interval(hours => source.maximum_freshness_hours)),
    1
  ) on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    location = excluded.location,
    description = excluded.description,
    property_type = excluded.property_type,
    completion_status = excluded.completion_status,
    price_aed = excluded.price_aed,
    beds = excluded.beds,
    baths = excluded.baths,
    area_sq_ft = excluded.area_sq_ft,
    feature = excluded.feature,
    match_reason = excluded.match_reason,
    image_url = excluded.image_url,
    image_alt = excluded.image_alt,
    availability_status = excluded.availability_status,
    source_name = excluded.source_name,
    provider_source_id = excluded.provider_source_id,
    source_updated_at = excluded.source_updated_at,
    published_at = excluded.published_at,
    publication_ends_at = excluded.publication_ends_at,
    version = public.properties.version + 1
  where excluded.source_updated_at > public.properties.source_updated_at;

  update public.provider_records_staging
  set status = 'published', published_property_id = property_id, published_at = now()
  where id = staged.id;
  return property_id;
end;
$$;

revoke all on function public.publish_validated_provider_record(uuid) from public, anon, authenticated;
grant execute on function public.publish_validated_provider_record(uuid) to service_role;
