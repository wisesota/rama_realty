-- Buyer Decision Room foundation: governed public catalog, anonymous buyer
-- ownership, immutable publication facts, and narrow operational workflows.

-- ---------------------------------------------------------------------------
-- Catalog provenance, expiry, and normalized discovery features
-- ---------------------------------------------------------------------------

alter table public.properties add column if not exists publication_ends_at timestamptz;
alter table public.properties add column if not exists amenities text[] not null default '{}';
alter table public.properties add column if not exists view_types text[] not null default '{}';
alter table public.properties add column if not exists furnishing_status text;
alter table public.properties add column if not exists tenure text;
alter table public.properties add column if not exists handover_at date;
alter table public.properties add column if not exists service_charge_aed numeric(12,2);
alter table public.properties drop constraint if exists properties_furnishing_status_check;
alter table public.properties add constraint properties_furnishing_status_check
  check (furnishing_status is null or furnishing_status in ('unfurnished','semi_furnished','furnished'));
alter table public.properties drop constraint if exists properties_tenure_check;
alter table public.properties add constraint properties_tenure_check
  check (tenure is null or tenure in ('freehold','leasehold'));
alter table public.properties drop constraint if exists properties_publication_window_check;
alter table public.properties add constraint properties_publication_window_check
  check (publication_ends_at is null or published_at is null or publication_ends_at > published_at);

alter table public.payment_plans add column if not exists source_name text;
alter table public.payment_plans add column if not exists source_updated_at timestamptz;
alter table public.payment_plans add column if not exists published_at timestamptz;
alter table public.payment_plans add column if not exists publication_ends_at timestamptz;
alter table public.payment_plans add column if not exists version integer not null default 1;
alter table public.payment_plans add column if not exists is_default boolean not null default false;
alter table public.payment_plans add column if not exists effective_from date;
alter table public.payment_plans add column if not exists effective_to date;
alter table public.payment_plans add constraint payment_plans_version_positive check (version > 0);
alter table public.payment_plans add constraint payment_plans_effective_window
  check (effective_to is null or effective_from is null or effective_to >= effective_from);

alter table public.floor_plans add column if not exists source_name text;
alter table public.floor_plans add column if not exists source_updated_at timestamptz;
alter table public.floor_plans add column if not exists published_at timestamptz;
alter table public.floor_plans add column if not exists publication_ends_at timestamptz;
alter table public.floor_plans add column if not exists version integer not null default 1;
alter table public.floor_plans add column if not exists is_default boolean not null default false;
alter table public.floor_plans add constraint floor_plans_version_positive check (version > 0);

alter table public.developments add column if not exists publication_ends_at timestamptz;
alter table public.content_entries add column if not exists source_name text;
alter table public.content_entries add column if not exists source_updated_at timestamptz;
alter table public.content_entries add column if not exists publication_ends_at timestamptz;
alter table public.content_entries add column if not exists version integer not null default 1;
alter table public.content_entries add constraint content_entries_version_positive check (version > 0);

alter table public.payment_plan_installments add column if not exists created_at timestamptz not null default now();
alter table public.payment_plan_installments add column if not exists updated_at timestamptz not null default now();

create unique index if not exists payment_plans_one_default_property_idx
  on public.payment_plans (property_id)
  where property_id is not null and is_default and publication_status = 'published';
create unique index if not exists payment_plans_one_default_development_idx
  on public.payment_plans (development_id)
  where development_id is not null and is_default and publication_status = 'published';
create unique index if not exists floor_plans_one_default_property_idx
  on public.floor_plans (property_id)
  where property_id is not null and is_default and publication_status = 'published';

create index if not exists properties_public_eligibility_idx
  on public.properties (publication_status, status, availability_status, source_updated_at desc, price_aed, beds)
  where organization_id is not null;

-- The view carries an explicit public predicate, so a staff cookie cannot widen
-- public landing results through the broader authenticated base-table policy.
drop view if exists public.public_property_catalog;
create view public.public_property_catalog
with (security_invoker = true)
as
select
  property.id,
  property.organization_id,
  property.development_id,
  property.slug,
  property.name,
  property.location,
  property.description,
  property.property_type,
  property.completion_status,
  property.availability_status,
  property.price_aed,
  property.beds,
  property.baths,
  property.area_sq_ft,
  property.feature,
  property.match_reason,
  property.image_url,
  property.image_alt,
  property.amenities,
  property.view_types,
  property.furnishing_status,
  property.tenure,
  property.handover_at,
  property.service_charge_aed,
  property.status,
  property.publication_status,
  property.source_name,
  property.source_updated_at,
  property.published_at,
  property.publication_ends_at,
  property.version,
  property.updated_at
from public.properties property
where
  (property.status = 'illustrative' and property.organization_id is null)
  or (
    property.organization_id is not null
    and property.status = 'live'
    and property.publication_status = 'published'
    and property.availability_status = 'available'
    and property.published_at is not null
    and property.published_at <= now()
    and (property.publication_ends_at is null or property.publication_ends_at > now())
    and property.source_updated_at is not null
    and property.source_updated_at >= now() - interval '30 days'
  );

revoke all on public.public_property_catalog from public;
grant select on public.public_property_catalog to anon, authenticated, service_role;

-- Keep base-table RLS aligned with the explicit view predicate.
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
      and (publication_ends_at is null or publication_ends_at > now())
      and source_updated_at is not null
      and source_updated_at >= now() - interval '30 days'
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
      and (publication_ends_at is null or publication_ends_at > now())
      and source_updated_at is not null
      and source_updated_at >= now() - interval '30 days'
    )
    or (organization_id is not null and private.is_org_member(organization_id))
  );

-- ---------------------------------------------------------------------------
-- Publication immutability and child integrity
-- ---------------------------------------------------------------------------

create or replace function private.validate_property_publication_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  allowed_transition boolean;
  old_content jsonb;
  new_content jsonb;
begin
  old_content := to_jsonb(old) - array['updated_at','updated_by','publication_status','published_at','version'];
  new_content := to_jsonb(new) - array['updated_at','updated_by','publication_status','published_at','version'];

  if old.publication_status = 'published' and old_content is distinct from new_content then
    raise exception 'Published property facts must return to review before editing' using errcode = '23514';
  end if;
  if old.publication_status = 'published' and new.publication_status = 'published'
    and to_jsonb(old) - 'updated_at' is distinct from to_jsonb(new) - 'updated_at'
  then
    raise exception 'Published property rows are immutable' using errcode = '23514';
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
    raise exception 'Invalid property publication transition: % to %', old.publication_status, new.publication_status using errcode = '23514';
  end if;

  if new.publication_status in ('published', 'archived') then
    if not private.has_org_role(new.organization_id, array['owner','admin','editor']) and caller_id is not null then
      raise exception 'Publication role required' using errcode = '42501';
    end if;
  elsif not private.has_org_role(new.organization_id, array['owner','admin','inventory_manager','editor']) and caller_id is not null then
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
      or (new.publication_ends_at is not null and new.publication_ends_at <= now())
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

create or replace function private.enforce_server_publication_workflow()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  old_json jsonb := to_jsonb(old);
  new_json jsonb := to_jsonb(new);
  old_status text := old_json ->> 'publication_status';
  new_status text := new_json ->> 'publication_status';
  old_version integer := coalesce((old_json ->> 'version')::integer, 1);
  new_version integer := coalesce((new_json ->> 'version')::integer, 1);
  source_name text := new_json ->> 'source_name';
  source_updated_at timestamptz := nullif(new_json ->> 'source_updated_at', '')::timestamptz;
  publication_ends_at timestamptz := nullif(new_json ->> 'publication_ends_at', '')::timestamptz;
begin
  if old_status = 'published' then
    if old_json - 'updated_at' is distinct from new_json - 'updated_at'
      and new_status = 'published'
    then
      raise exception 'Published catalog facts are immutable' using errcode = '23514';
    end if;
    if old_json - array['updated_at','updated_by','publication_status','published_at','version']
      is distinct from new_json - array['updated_at','updated_by','publication_status','published_at','version']
    then
      raise exception 'Return published content to review before editing' using errcode = '23514';
    end if;
  end if;

  if old_status is distinct from new_status then
    if new_version <> old_version + 1 then
      raise exception 'Publication transitions must increment version by one' using errcode = '40001';
    end if;
    if caller_id is not null and new_status = 'published' then
      raise exception 'This catalog type requires the governed server publication workflow' using errcode = '42501';
    end if;
    if new_status = 'published' then
      if source_name is null or char_length(btrim(source_name)) < 2
        or source_updated_at is null
        or source_updated_at < now() - interval '30 days'
        or (publication_ends_at is not null and publication_ends_at <= now())
      then
        raise exception 'Catalog record does not satisfy the publication contract' using errcode = '23514';
      end if;
      new.published_at := coalesce(new.published_at, now());
    elsif old_status = 'published' then
      new.published_at := null;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_server_publication_workflow() from public, anon, authenticated;

create or replace function private.protect_published_installments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_plan_id uuid := coalesce(new.payment_plan_id, old.payment_plan_id);
begin
  if exists (
    select 1 from public.payment_plans plan
    where plan.id = target_plan_id and plan.publication_status = 'published'
  ) then
    raise exception 'Installments under a published payment plan are immutable' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function private.protect_published_installments() from public, anon, authenticated;
drop trigger if exists protect_published_installments on public.payment_plan_installments;
create trigger protect_published_installments
before insert or update or delete on public.payment_plan_installments
for each row execute function private.protect_published_installments();

create or replace function private.validate_payment_plan_publication()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  installment_total numeric(7,2);
begin
  if new.publication_status = 'published' and old.publication_status is distinct from new.publication_status then
    select coalesce(sum(item.percentage), 0) into installment_total
    from public.payment_plan_installments item
    where item.payment_plan_id = new.id;
    if installment_total <> new.total_percentage then
      raise exception 'Published installment percentages must total %', new.total_percentage using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.validate_payment_plan_publication() from public, anon, authenticated;
drop trigger if exists validate_payment_plan_publication on public.payment_plans;
create trigger validate_payment_plan_publication
before update of publication_status on public.payment_plans
for each row execute function private.validate_payment_plan_publication();

-- ---------------------------------------------------------------------------
-- Property documents and buyer-owned operational records
-- ---------------------------------------------------------------------------

create table if not exists public.property_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id text references public.properties(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  document_type text not null check (document_type in ('brochure','payment_schedule','floor_plan','fact_sheet','disclosure')),
  title text not null check (char_length(title) between 2 and 160),
  file_url text not null check (file_url ~ '^https?://'),
  mime_type text not null default 'application/pdf',
  source_name text not null check (char_length(source_name) between 2 and 160),
  source_updated_at timestamptz not null,
  publication_status text not null default 'draft' check (publication_status in ('draft','in_review','published','archived')),
  published_at timestamptz,
  publication_ends_at timestamptz,
  version integer not null default 1 check (version > 0),
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint property_documents_parent check ((property_id is null) <> (development_id is null))
);
create index if not exists property_documents_property_idx on public.property_documents (property_id, publication_status, updated_at desc);
create index if not exists property_documents_development_idx on public.property_documents (development_id, publication_status, updated_at desc);
alter table public.property_documents enable row level security;

create table if not exists public.buyer_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint buyer_sessions_expiry check (expires_at > created_at)
);
create index if not exists buyer_sessions_active_idx on public.buyer_sessions (expires_at, last_seen_at desc) where revoked_at is null;
alter table public.buyer_sessions enable row level security;

alter table public.search_runs add column if not exists buyer_session_id uuid references public.buyer_sessions(id) on delete cascade;
alter table public.search_runs add column if not exists conversation_id uuid references public.conversation_sessions(id) on delete set null;
alter table public.search_runs add column if not exists status text not null default 'completed';
alter table public.search_runs add constraint search_runs_status_check check (status in ('processing','completed','partial','failed'));
alter table public.search_candidates add column if not exists property_version integer;
alter table public.search_candidates add column if not exists source_observed_at timestamptz;
alter table public.search_candidates add column if not exists fact_snapshot jsonb not null default '{}'::jsonb;
alter table public.conversation_sessions add column if not exists buyer_session_id uuid references public.buyer_sessions(id) on delete cascade;
alter table public.tool_runs add column if not exists buyer_session_id uuid references public.buyer_sessions(id) on delete cascade;
alter table public.inquiries add column if not exists buyer_session_id uuid references public.buyer_sessions(id) on delete set null;
alter table public.inquiries add column if not exists search_run_id uuid references public.search_runs(id) on delete set null;
alter table public.inquiries add column if not exists consent_purpose text;
alter table public.inquiries add column if not exists consent_policy_version text;
alter table public.inquiries add column if not exists consent_destination text;
alter table public.inquiries add column if not exists idempotency_key text;
alter table public.inquiries add column if not exists correlation_id uuid not null default gen_random_uuid();
create unique index if not exists inquiries_buyer_idempotency_idx
  on public.inquiries (buyer_session_id, idempotency_key)
  where buyer_session_id is not null and idempotency_key is not null;

create table if not exists public.buyer_shortlist_items (
  buyer_session_id uuid not null references public.buyer_sessions(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (buyer_session_id, property_id)
);
alter table public.buyer_shortlist_items enable row level security;

create table if not exists public.crm_outbox (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 120),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','delivered','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  available_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (inquiry_id, event_type)
);
create index if not exists crm_outbox_delivery_idx on public.crm_outbox (status, available_at, id);
alter table public.crm_outbox enable row level security;

-- New 2026 Supabase projects no longer auto-expose tables: grants are explicit.
revoke all on public.buyer_sessions, public.buyer_shortlist_items, public.crm_outbox from public, anon, authenticated;
grant all on public.buyer_sessions, public.buyer_shortlist_items, public.crm_outbox to service_role;
grant usage, select on sequence public.crm_outbox_id_seq to service_role;
grant select on public.property_documents to anon, authenticated;
grant insert, update, delete on public.property_documents to authenticated;
grant all on public.property_documents to service_role;

drop policy if exists "Public reads published property documents" on public.property_documents;
create policy "Public reads published property documents" on public.property_documents for select to anon, authenticated
using (
  publication_status = 'published'
  and source_updated_at >= now() - interval '30 days'
  and (publication_ends_at is null or publication_ends_at > now())
  and (
    (property_id is not null and exists (
      select 1 from public.public_property_catalog property where property.id = property_id
    ))
    or (development_id is not null and exists (
      select 1 from public.developments development
      where development.id = development_id
        and development.publication_status = 'published'
        and development.source_updated_at >= now() - interval '30 days'
    ))
  )
);
drop policy if exists "Members manage property documents" on public.property_documents;
create policy "Members manage property documents" on public.property_documents for all to authenticated
using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));

drop trigger if exists enforce_tenant_draft_insert on public.property_documents;
create trigger enforce_tenant_draft_insert before insert on public.property_documents
for each row execute function private.enforce_tenant_draft_insert();
drop trigger if exists enforce_server_publication_workflow on public.property_documents;
create trigger enforce_server_publication_workflow before update on public.property_documents
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists validate_catalog_parent_organization on public.property_documents;
create trigger validate_catalog_parent_organization
before insert or update of organization_id, property_id, development_id on public.property_documents
for each row execute function private.validate_catalog_parent_organization();
drop trigger if exists property_documents_set_updated_at on public.property_documents;
create trigger property_documents_set_updated_at before update on public.property_documents
for each row execute function private.set_updated_at();
drop trigger if exists payment_plan_installments_set_updated_at on public.payment_plan_installments;
create trigger payment_plan_installments_set_updated_at before update on public.payment_plan_installments
for each row execute function private.set_updated_at();

-- Replace transition-only triggers with full-row guards.
drop trigger if exists enforce_server_publication_workflow on public.developments;
create trigger enforce_server_publication_workflow before update on public.developments
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists enforce_server_publication_workflow on public.payment_plans;
create trigger enforce_server_publication_workflow before update on public.payment_plans
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists enforce_server_publication_workflow on public.floor_plans;
create trigger enforce_server_publication_workflow before update on public.floor_plans
for each row execute function private.enforce_server_publication_workflow();
drop trigger if exists enforce_server_publication_workflow on public.content_entries;
create trigger enforce_server_publication_workflow before update on public.content_entries
for each row execute function private.enforce_server_publication_workflow();

-- Browser roles cannot forge operational/audit-looking records. All writes pass
-- through constrained server routes or service-role-only RPCs.
revoke insert on public.search_runs, public.search_candidates, public.conversation_sessions,
  public.conversation_messages, public.tool_runs, public.inquiries from authenticated;
revoke update on public.inquiries from authenticated;

create or replace function private.protect_inquiry_provenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (old.organization_id, old.user_id, old.buyer_session_id, old.property_id, old.session_id,
      old.search_run_id, old.full_name, old.email, old.phone, old.message, old.consent_at,
      old.consent_purpose, old.consent_policy_version, old.consent_destination, old.idempotency_key,
      old.correlation_id)
    is distinct from
     (new.organization_id, new.user_id, new.buyer_session_id, new.property_id, new.session_id,
      new.search_run_id, new.full_name, new.email, new.phone, new.message, new.consent_at,
      new.consent_purpose, new.consent_policy_version, new.consent_destination, new.idempotency_key,
      new.correlation_id)
  then
    raise exception 'Inquiry provenance, consent, and original contact payload are immutable' using errcode = '23514';
  end if;
  if new.assigned_to is not null and not exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = new.organization_id
      and membership.user_id = new.assigned_to
      and membership.status = 'active'
      and membership.role in ('owner','admin','agent')
  ) then
    raise exception 'Inquiry assignee must be an active advisor in the same organization' using errcode = '23503';
  end if;
  return new;
end;
$$;
revoke all on function private.protect_inquiry_provenance() from public, anon, authenticated;
drop trigger if exists protect_inquiry_provenance on public.inquiries;
create trigger protect_inquiry_provenance before update on public.inquiries
for each row execute function private.protect_inquiry_provenance();

create or replace function public.transition_inquiry(
  p_inquiry_id uuid,
  p_status text,
  p_assigned_to uuid default null
)
returns public.inquiries
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  current_row public.inquiries;
  updated_row public.inquiries;
begin
  if actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into current_row from public.inquiries where id = p_inquiry_id for update;
  if current_row.id is null or not private.has_org_role(current_row.organization_id, array['owner','admin','agent']) then
    raise exception 'Inquiry not found' using errcode = '42501';
  end if;
  if p_status not in ('new','qualified','contacted','viewing_booked','closed','spam') then
    raise exception 'Invalid inquiry status' using errcode = '23514';
  end if;
  update public.inquiries set status = p_status, assigned_to = p_assigned_to
  where id = p_inquiry_id returning * into updated_row;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, before_state, after_state, correlation_id)
  values (updated_row.organization_id, actor_id, 'inquiry.transitioned', 'inquiry', updated_row.id::text,
    jsonb_build_object('status', current_row.status, 'assigned_to', current_row.assigned_to),
    jsonb_build_object('status', updated_row.status, 'assigned_to', updated_row.assigned_to),
    updated_row.correlation_id);
  return updated_row;
end;
$$;
revoke all on function public.transition_inquiry(uuid, text, uuid) from public, anon;
grant execute on function public.transition_inquiry(uuid, text, uuid) to authenticated;

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
    insert into public.buyer_sessions (token_hash, expires_at)
    values (p_token_hash, now() + make_interval(secs => p_ttl_seconds))
    returning id into buyer_id;
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
revoke all on function public.persist_buyer_search(text, text, text, jsonb, jsonb, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.persist_buyer_search(text, text, text, jsonb, jsonb, uuid, text, integer) to service_role;

create or replace function public.create_buyer_inquiry(
  p_token_hash text,
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
  conversation_id uuid;
  organization_id uuid;
  inquiry_id uuid;
begin
  select id into buyer_id from public.buyer_sessions
  where token_hash = p_token_hash and revoked_at is null and expires_at > now();
  if buyer_id is null then raise exception 'Buyer session not found' using errcode = '42501'; end if;
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
  return inquiry_id;
end;
$$;
revoke all on function public.create_buyer_inquiry(text, uuid, text, text, text, text, text, text, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.create_buyer_inquiry(text, uuid, text, text, text, text, text, text, text, text, text, uuid) to service_role;

-- Keep public child reads fresh and parent-eligible.
drop policy if exists "Public reads published payment plans" on public.payment_plans;
create policy "Public reads published payment plans" on public.payment_plans for select to anon, authenticated
using (
  publication_status = 'published'
  and source_updated_at >= now() - interval '30 days'
  and (publication_ends_at is null or publication_ends_at > now())
  and (
    (property_id is not null and exists (select 1 from public.public_property_catalog property where property.id = property_id))
    or (development_id is not null and exists (
      select 1 from public.developments development where development.id = development_id
        and development.publication_status = 'published'
        and development.source_updated_at >= now() - interval '30 days'
        and (development.publication_ends_at is null or development.publication_ends_at > now())
    ))
  )
);
drop policy if exists "Public reads published payment installments" on public.payment_plan_installments;
create policy "Public reads published payment installments" on public.payment_plan_installments for select to anon, authenticated
using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id
  and plan.publication_status = 'published'
  and plan.source_updated_at >= now() - interval '30 days'
  and (plan.publication_ends_at is null or plan.publication_ends_at > now())));
drop policy if exists "Public reads published floor plans" on public.floor_plans;
create policy "Public reads published floor plans" on public.floor_plans for select to anon, authenticated
using (
  publication_status = 'published'
  and source_updated_at >= now() - interval '30 days'
  and (publication_ends_at is null or publication_ends_at > now())
  and (
    (property_id is not null and exists (select 1 from public.public_property_catalog property where property.id = property_id))
    or (development_id is not null and exists (
      select 1 from public.developments development where development.id = development_id
        and development.publication_status = 'published'
        and development.source_updated_at >= now() - interval '30 days'
        and (development.publication_ends_at is null or development.publication_ends_at > now())
    ))
  )
);
