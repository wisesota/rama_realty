-- Close tenant-boundary and direct-publication paths exposed by the Data API.

create unique index if not exists organization_memberships_one_active_per_user_idx
  on public.organization_memberships (user_id)
  where status = 'active';

alter table public.properties drop constraint if exists properties_name_check;
alter table public.properties add constraint properties_name_check
  check (char_length(name) between 2 and 160);
alter table public.properties drop constraint if exists properties_location_check;
alter table public.properties add constraint properties_location_check
  check (char_length(location) between 2 and 160);

create or replace function private.enforce_tenant_property_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null then
    if new.organization_id is null then
      raise exception 'Tenant properties require an organization' using errcode = '23514';
    end if;
    if new.status = 'illustrative' then
      raise exception 'Illustrative status is reserved for platform seed records' using errcode = '42501';
    end if;
    if new.publication_status <> 'draft' or new.published_at is not null or new.version <> 1 then
      raise exception 'Tenant properties must begin as unpublished version-one drafts' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_tenant_property_insert() from public, anon, authenticated;
drop trigger if exists enforce_tenant_property_insert on public.properties;
create trigger enforce_tenant_property_insert
before insert on public.properties
for each row execute function private.enforce_tenant_property_insert();

create or replace function private.enforce_tenant_draft_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and new.publication_status <> 'draft' then
    raise exception 'Tenant catalog records must begin as drafts' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_tenant_draft_insert() from public, anon, authenticated;

drop trigger if exists enforce_tenant_draft_insert on public.developments;
create trigger enforce_tenant_draft_insert before insert on public.developments
for each row execute function private.enforce_tenant_draft_insert();
drop trigger if exists enforce_tenant_draft_insert on public.payment_plans;
create trigger enforce_tenant_draft_insert before insert on public.payment_plans
for each row execute function private.enforce_tenant_draft_insert();
drop trigger if exists enforce_tenant_draft_insert on public.floor_plans;
create trigger enforce_tenant_draft_insert before insert on public.floor_plans
for each row execute function private.enforce_tenant_draft_insert();
drop trigger if exists enforce_tenant_draft_insert on public.content_entries;
create trigger enforce_tenant_draft_insert before insert on public.content_entries
for each row execute function private.enforce_tenant_draft_insert();

create or replace function private.enforce_server_publication_workflow()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null
    and old.publication_status is distinct from new.publication_status
    and new.publication_status = 'published'
  then
    raise exception 'This catalog type requires the governed server publication workflow' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_server_publication_workflow() from public, anon, authenticated;

drop trigger if exists enforce_server_publication_workflow on public.developments;
create trigger enforce_server_publication_workflow before update of publication_status on public.developments
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists enforce_server_publication_workflow on public.payment_plans;
create trigger enforce_server_publication_workflow before update of publication_status on public.payment_plans
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists enforce_server_publication_workflow on public.floor_plans;
create trigger enforce_server_publication_workflow before update of publication_status on public.floor_plans
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists enforce_server_publication_workflow on public.content_entries;
create trigger enforce_server_publication_workflow before update of publication_status on public.content_entries
for each row execute function private.enforce_server_publication_workflow();

create or replace function private.validate_catalog_parent_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'properties' then
    if new.development_id is not null and not exists (
      select 1 from public.developments development
      where development.id = new.development_id
        and development.organization_id = new.organization_id
    ) then
      raise exception 'Property development belongs to a different organization' using errcode = '23503';
    end if;
  else
    if (new.property_id is null) = (new.development_id is null) then
      raise exception 'Exactly one catalog parent is required' using errcode = '23514';
    end if;
    if new.property_id is not null and not exists (
      select 1 from public.properties property
      where property.id = new.property_id
        and property.organization_id = new.organization_id
    ) then
      raise exception 'Property parent belongs to a different organization' using errcode = '23503';
    end if;
    if new.development_id is not null and not exists (
      select 1 from public.developments development
      where development.id = new.development_id
        and development.organization_id = new.organization_id
    ) then
      raise exception 'Development parent belongs to a different organization' using errcode = '23503';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.validate_catalog_parent_organization() from public, anon, authenticated;

drop trigger if exists validate_catalog_parent_organization on public.properties;
create trigger validate_catalog_parent_organization before insert or update of organization_id, development_id on public.properties
for each row execute function private.validate_catalog_parent_organization();
drop trigger if exists validate_catalog_parent_organization on public.payment_plans;
create trigger validate_catalog_parent_organization before insert or update of organization_id, property_id, development_id on public.payment_plans
for each row execute function private.validate_catalog_parent_organization();
drop trigger if exists validate_catalog_parent_organization on public.floor_plans;
create trigger validate_catalog_parent_organization before insert or update of organization_id, property_id, development_id on public.floor_plans
for each row execute function private.validate_catalog_parent_organization();

drop policy if exists "Guests read available properties" on public.properties;
create policy "Guests read available properties" on public.properties for select to anon
  using (
    (status = 'illustrative' and organization_id is null)
    or (
      organization_id is not null
      and status = 'live'
      and publication_status = 'published'
      and availability_status = 'available'
      and published_at is not null
      and published_at <= now()
    )
  );

drop policy if exists "Authenticated users read visible properties" on public.properties;
create policy "Authenticated users read visible properties" on public.properties for select to authenticated
  using (
    (status = 'illustrative' and organization_id is null)
    or (
      organization_id is not null
      and status = 'live'
      and publication_status = 'published'
      and availability_status = 'available'
      and published_at is not null
      and published_at <= now()
    )
    or (organization_id is not null and private.is_org_member(organization_id))
  );

drop policy if exists "Catalog managers create properties" on public.properties;
create policy "Catalog managers create properties" on public.properties for insert to authenticated
  with check (
    organization_id is not null
    and private.has_org_role(organization_id, array['owner','admin','inventory_manager'])
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
    and status <> 'illustrative'
    and publication_status = 'draft'
  );

drop policy if exists "Users create their search runs" on public.search_runs;
create policy "Users create their search runs" on public.search_runs for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (search_runs.organization_id is null or private.is_org_member(search_runs.organization_id))
  );

drop policy if exists "Users create conversation sessions" on public.conversation_sessions;
create policy "Users create conversation sessions" on public.conversation_sessions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (conversation_sessions.organization_id is null or private.is_org_member(conversation_sessions.organization_id))
  );

drop policy if exists "Users create their tool runs" on public.tool_runs;
create policy "Users create their tool runs" on public.tool_runs for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (tool_runs.organization_id is null or private.is_org_member(tool_runs.organization_id))
    and (
      session_id is null
      or exists (
        select 1 from public.conversation_sessions session
        where session.id = session_id
          and session.user_id = (select auth.uid())
          and (tool_runs.organization_id is null or session.organization_id is null or session.organization_id = tool_runs.organization_id)
      )
    )
  );

drop policy if exists "Users create inquiries" on public.inquiries;
create policy "Users create inquiries" on public.inquiries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'new'
    and assigned_to is null
    and (
      inquiries.organization_id is null
      or (
        property_id is not null
        and exists (
          select 1 from public.properties property
          where property.id = inquiries.property_id and property.organization_id = inquiries.organization_id
        )
      )
    )
    and (
      session_id is null
      or exists (
        select 1 from public.conversation_sessions session
        where session.id = session_id
          and session.user_id = (select auth.uid())
          and (inquiries.organization_id is null or session.organization_id is null or session.organization_id = inquiries.organization_id)
      )
    )
  );

alter table public.api_rate_limits drop constraint if exists api_rate_limits_scope_check;
alter table public.api_rate_limits add constraint api_rate_limits_scope_check
  check (scope in ('gemini-live-token', 'gemini-voice-turn', 'agent-tool', 'property-search'));

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_time timestamptz := clock_timestamp();
  current_count integer;
  current_reset timestamptz;
begin
  if p_scope not in ('gemini-live-token', 'gemini-voice-turn', 'agent-tool', 'property-search') then
    raise exception 'Unsupported rate-limit scope';
  end if;
  if p_bucket_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate-limit bucket'; end if;
  if p_window_seconds < 1 or p_window_seconds > 3600 then raise exception 'Invalid rate-limit window'; end if;
  if p_max_requests < 1 or p_max_requests > 100 then raise exception 'Invalid rate-limit maximum'; end if;

  insert into public.api_rate_limits (scope, bucket_key, request_count, window_started_at, expires_at)
  values (p_scope, p_bucket_key, 1, current_time, current_time + make_interval(secs => p_window_seconds))
  on conflict (scope, bucket_key) do update set
    request_count = case when public.api_rate_limits.expires_at <= current_time then 1 else public.api_rate_limits.request_count + 1 end,
    window_started_at = case when public.api_rate_limits.expires_at <= current_time then current_time else public.api_rate_limits.window_started_at end,
    expires_at = case when public.api_rate_limits.expires_at <= current_time then current_time + make_interval(secs => p_window_seconds) else public.api_rate_limits.expires_at end
  returning request_count, expires_at into current_count, current_reset;

  return query select current_count <= p_max_requests, greatest(0, p_max_requests - current_count), current_reset;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
