-- Make property publication transitions and their audit records database-enforced.

create or replace function private.validate_property_publication_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  allowed_transition boolean;
begin
  if old.publication_status = 'published'
    and new.publication_status = 'published'
    and coalesce(pg_catalog.current_setting('rama.provider_publication', true), 'off') <> 'on'
    and (
      old.name,
      old.location,
      old.price_aed,
      old.beds,
      old.baths,
      old.area_sq_ft,
      old.feature,
      old.match_reason,
      old.image_url,
      old.image_alt,
      old.development_id,
      old.slug,
      old.description,
      old.property_type,
      old.completion_status,
      old.source_name
    ) is distinct from (
      new.name,
      new.location,
      new.price_aed,
      new.beds,
      new.baths,
      new.area_sq_ft,
      new.feature,
      new.match_reason,
      new.image_url,
      new.image_alt,
      new.development_id,
      new.slug,
      new.description,
      new.property_type,
      new.completion_status,
      new.source_name
    )
  then
    raise exception 'Published property content must return to review before editing' using errcode = '23514';
  end if;

  if old.publication_status is not distinct from new.publication_status then
    return new;
  end if;

  allowed_transition := case old.publication_status
    when 'draft' then new.publication_status in ('in_review', 'archived')
    when 'in_review' then new.publication_status in ('draft', 'published', 'archived')
    when 'published' then new.publication_status in ('in_review', 'archived')
    when 'archived' then new.publication_status = 'draft'
    else false
  end;
  if not allowed_transition then
    raise exception 'Invalid property publication transition: % to %', old.publication_status, new.publication_status
      using errcode = '23514';
  end if;

  if new.publication_status in ('published', 'archived') then
    if not private.has_org_role(new.organization_id, array['owner','admin','editor']) then
      raise exception 'Publication role required' using errcode = '42501';
    end if;
  elsif not private.has_org_role(new.organization_id, array['owner','admin','inventory_manager','editor']) then
    raise exception 'Catalog role required' using errcode = '42501';
  end if;

  if new.publication_status = 'published' then
    if new.status <> 'live'
      or new.availability_status <> 'available'
      or new.source_name is null
      or char_length(btrim(new.source_name)) < 2
      or new.source_updated_at is null
      or new.source_updated_at < now() - interval '30 days'
      or new.description is null
      or char_length(btrim(new.description)) < 40
      or new.slug is null
      or new.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      or new.image_url !~ '^https?://'
      or char_length(btrim(new.image_alt)) < 2
    then
      raise exception 'Property does not satisfy the publication contract' using errcode = '23514';
    end if;
    new.published_at := coalesce(new.published_at, now());
  elsif old.publication_status = 'published' then
    new.published_at := null;
  end if;

  if new.version <> old.version + 1 then
    raise exception 'Publication transitions must increment version by one' using errcode = '40001';
  end if;
  if caller_id is not null and new.updated_by is distinct from caller_id then
    raise exception 'updated_by must match the authenticated user' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_property_publication_change() from public, anon, authenticated;

drop trigger if exists validate_property_publication_change on public.properties;
create trigger validate_property_publication_change
before update on public.properties
for each row execute function private.validate_property_publication_change();

create or replace function private.audit_property_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := coalesce((select auth.uid()), new.updated_by, new.created_by);
begin
  if tg_op = 'INSERT' then
    insert into public.audit_events (
      organization_id, actor_user_id, action, entity_type, entity_id, after_state
    ) values (
      new.organization_id,
      actor_id,
      'property.created',
      'property',
      new.id,
      jsonb_build_object(
        'name', new.name,
        'location', new.location,
        'publication_status', new.publication_status,
        'source_name', new.source_name,
        'version', new.version
      )
    );
  elsif old.publication_status is distinct from new.publication_status then
    insert into public.audit_events (
      organization_id, actor_user_id, action, entity_type, entity_id, before_state, after_state
    ) values (
      new.organization_id,
      actor_id,
      'property.' || new.publication_status,
      'property',
      new.id,
      jsonb_build_object('publication_status', old.publication_status, 'version', old.version),
      jsonb_build_object('publication_status', new.publication_status, 'version', new.version)
    );
  end if;
  return new;
end;
$$;

revoke all on function private.audit_property_change() from public, anon, authenticated;

drop trigger if exists audit_property_change on public.properties;
create trigger audit_property_change
after insert or update of publication_status on public.properties
for each row execute function private.audit_property_change();

create or replace function private.audit_organization_creation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_events (
    organization_id, actor_user_id, action, entity_type, entity_id, after_state
  ) values (
    new.id,
    coalesce((select auth.uid()), new.created_by),
    'organization.created',
    'organization',
    new.id::text,
    jsonb_build_object('name', new.name, 'slug', new.slug)
  );
  return new;
end;
$$;

revoke all on function private.audit_organization_creation() from public, anon, authenticated;

drop trigger if exists audit_organization_creation on public.organizations;
create trigger audit_organization_creation
after insert on public.organizations
for each row execute function private.audit_organization_creation();

drop policy if exists "Members append audit events" on public.audit_events;
revoke insert on public.audit_events from authenticated;
