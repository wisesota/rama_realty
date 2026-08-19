-- Rama Realty enterprise foundation.
-- Apply to a Supabase development branch before promoting to production.
-- Inventory remains explicitly illustrative until a licensed source is connected.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Identity and organizations
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (full_name is null or char_length(full_name) between 2 and 120)
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_length check (char_length(name) between 2 and 120),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer',
  status text not null default 'active',
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  constraint organization_memberships_role check (
    role in ('owner', 'admin', 'inventory_manager', 'editor', 'agent', 'analyst', 'viewer')
  ),
  constraint organization_memberships_status check (status in ('active', 'invited', 'suspended'))
);

create index if not exists organization_memberships_user_status_idx
  on public.organization_memberships (user_id, status, organization_id);

create or replace function private.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create or replace function private.has_org_role(p_organization_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any(p_roles)
  );
$$;

revoke all on function private.is_org_member(uuid) from public, anon;
revoke all on function private.has_org_role(uuid, text[]) from public, anon;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.has_org_role(uuid, text[]) to authenticated, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), ''),
    nullif(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function public.bootstrap_staff_workspace(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  workspace_id uuid;
  normalized_name text := btrim(p_name);
  normalized_slug text := lower(btrim(p_slug));
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if char_length(normalized_name) not between 2 and 120 then
    raise exception 'Workspace name must be between 2 and 120 characters';
  end if;
  if normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Workspace slug is invalid';
  end if;
  if exists (
    select 1 from public.organization_memberships membership
    where membership.user_id = caller_id and membership.status = 'active'
  ) then
    raise exception 'User already belongs to a workspace';
  end if;

  insert into public.organizations (name, slug, created_by)
  values (normalized_name, normalized_slug, caller_id)
  returning id into workspace_id;

  insert into public.organization_memberships (organization_id, user_id, role, status)
  values (workspace_id, caller_id, 'owner', 'active');

  return workspace_id;
end;
$$;

revoke all on function public.bootstrap_staff_workspace(text, text) from public, anon;
grant execute on function public.bootstrap_staff_workspace(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Governed property catalog
-- ---------------------------------------------------------------------------

create table if not exists public.developments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  developer_name text,
  emirate text not null default 'Dubai',
  community text not null,
  description text,
  completion_status text not null default 'ready',
  publication_status text not null default 'draft',
  source_name text,
  source_updated_at timestamptz,
  published_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  unique (organization_id, slug),
  constraint developments_name_length check (char_length(name) between 2 and 160),
  constraint developments_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint developments_completion_status check (completion_status in ('off_plan', 'under_construction', 'ready')),
  constraint developments_publication_status check (publication_status in ('draft', 'in_review', 'published', 'archived')),
  constraint developments_version_positive check (version > 0)
);

create index if not exists developments_org_publication_idx
  on public.developments (organization_id, publication_status, updated_at desc);
create index if not exists developments_public_idx
  on public.developments (community, updated_at desc)
  where publication_status = 'published';

create table if not exists public.properties (
  id text primary key,
  name text not null check (char_length(name) between 2 and 160),
  location text not null check (char_length(location) between 2 and 160),
  price_aed integer not null check (price_aed > 0),
  beds smallint not null check (beds between 0 and 30),
  baths smallint not null check (baths between 0 and 30),
  area_sq_ft integer not null check (area_sq_ft > 0),
  feature text not null check (char_length(feature) between 2 and 240),
  match_reason text not null default 'Matched against the current property brief.' check (char_length(match_reason) between 2 and 500),
  image_url text not null,
  image_alt text not null check (char_length(image_alt) between 2 and 300),
  status text not null default 'illustrative',
  created_at timestamptz not null default now()
);

alter table public.properties add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table public.properties add column if not exists development_id uuid references public.developments(id) on delete set null;
alter table public.properties add column if not exists slug text;
alter table public.properties add column if not exists description text;
alter table public.properties add column if not exists property_type text not null default 'apartment';
alter table public.properties add column if not exists completion_status text not null default 'ready';
alter table public.properties add column if not exists availability_status text not null default 'available';
alter table public.properties add column if not exists publication_status text not null default 'draft';
alter table public.properties add column if not exists source_name text;
alter table public.properties add column if not exists source_updated_at timestamptz;
alter table public.properties add column if not exists published_at timestamptz;
alter table public.properties add column if not exists updated_at timestamptz not null default now();
alter table public.properties add column if not exists created_by uuid references auth.users(id);
alter table public.properties add column if not exists updated_by uuid references auth.users(id);
alter table public.properties add column if not exists version integer not null default 1;

do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.properties'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status = %illustrative%'
  loop
    execute format('alter table public.properties drop constraint %I', constraint_row.conname);
  end loop;
end;
$$;

alter table public.properties drop constraint if exists properties_status_check;
alter table public.properties add constraint properties_status_check
  check (status in ('illustrative', 'live', 'withdrawn'));
alter table public.properties drop constraint if exists properties_property_type_check;
alter table public.properties add constraint properties_property_type_check
  check (property_type in ('apartment', 'villa', 'townhouse', 'penthouse', 'duplex', 'plot'));
alter table public.properties drop constraint if exists properties_completion_status_check;
alter table public.properties add constraint properties_completion_status_check
  check (completion_status in ('off_plan', 'under_construction', 'ready'));
alter table public.properties drop constraint if exists properties_availability_status_check;
alter table public.properties add constraint properties_availability_status_check
  check (availability_status in ('available', 'reserved', 'sold', 'unavailable'));
alter table public.properties drop constraint if exists properties_publication_status_check;
alter table public.properties add constraint properties_publication_status_check
  check (publication_status in ('draft', 'in_review', 'published', 'archived'));
alter table public.properties drop constraint if exists properties_version_positive;
alter table public.properties add constraint properties_version_positive check (version > 0);

create unique index if not exists properties_org_slug_uidx
  on public.properties (organization_id, slug)
  where organization_id is not null and slug is not null;
create index if not exists properties_org_publication_idx
  on public.properties (organization_id, publication_status, updated_at desc);
create index if not exists properties_public_search_idx
  on public.properties (location, beds, price_aed, id)
  where publication_status = 'published' and availability_status = 'available';
create index if not exists properties_development_idx
  on public.properties (development_id, updated_at desc);

create table if not exists public.payment_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id text references public.properties(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  name text not null,
  description text,
  currency text not null default 'AED',
  total_percentage numeric(5,2) not null default 100,
  publication_status text not null default 'draft',
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_plans_parent check (property_id is not null or development_id is not null),
  constraint payment_plans_currency check (currency ~ '^[A-Z]{3}$'),
  constraint payment_plans_percentage check (total_percentage > 0 and total_percentage <= 100),
  constraint payment_plans_publication_status check (publication_status in ('draft', 'in_review', 'published', 'archived'))
);

create table if not exists public.payment_plan_installments (
  id uuid primary key default gen_random_uuid(),
  payment_plan_id uuid not null references public.payment_plans(id) on delete cascade,
  sequence_no smallint not null check (sequence_no > 0),
  label text not null check (char_length(label) between 2 and 120),
  percentage numeric(5,2) not null check (percentage > 0 and percentage <= 100),
  due_offset_months integer check (due_offset_months is null or due_offset_months >= 0),
  due_event text,
  unique (payment_plan_id, sequence_no)
);

create index if not exists payment_plans_org_status_idx
  on public.payment_plans (organization_id, publication_status, updated_at desc);
create index if not exists payment_plans_property_idx on public.payment_plans (property_id);
create index if not exists payment_plans_development_idx on public.payment_plans (development_id);

create table if not exists public.floor_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  property_id text references public.properties(id) on delete cascade,
  development_id uuid references public.developments(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  beds smallint check (beds is null or beds between 0 and 30),
  baths smallint check (baths is null or baths between 0 and 30),
  area_sq_ft integer check (area_sq_ft is null or area_sq_ft > 0),
  image_url text not null,
  image_alt text not null check (char_length(image_alt) between 2 and 300),
  publication_status text not null default 'draft',
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint floor_plans_parent check (property_id is not null or development_id is not null),
  constraint floor_plans_publication_status check (publication_status in ('draft', 'in_review', 'published', 'archived'))
);

create index if not exists floor_plans_org_status_idx
  on public.floor_plans (organization_id, publication_status, updated_at desc);
create index if not exists floor_plans_property_idx on public.floor_plans (property_id);
create index if not exists floor_plans_development_idx on public.floor_plans (development_id);

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_type text not null,
  slug text not null,
  title text not null,
  summary text,
  body jsonb not null default '{}'::jsonb,
  publication_status text not null default 'draft',
  published_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, content_type, slug),
  constraint content_entries_type check (content_type in ('area_guide', 'buying_guide', 'faq', 'market_note', 'legal_disclaimer')),
  constraint content_entries_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint content_entries_publication_status check (publication_status in ('draft', 'in_review', 'published', 'archived'))
);

create index if not exists content_entries_org_status_idx
  on public.content_entries (organization_id, publication_status, updated_at desc);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 120),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null,
  before_state jsonb,
  after_state jsonb,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create index if not exists audit_events_org_created_idx
  on public.audit_events (organization_id, created_at desc, id desc);
create index if not exists audit_events_entity_idx
  on public.audit_events (organization_id, entity_type, entity_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Buyer journeys, agent tool calls, and lead handoff
-- ---------------------------------------------------------------------------

create table if not exists public.search_briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brief text not null check (char_length(brief) between 3 and 500),
  criteria text[] not null default '{}',
  source text not null check (source in ('text', 'voice')),
  result_ids text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.shortlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

create table if not exists public.search_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  source text not null check (source in ('text', 'voice')),
  raw_brief text not null check (char_length(raw_brief) between 3 and 2000),
  normalized_criteria jsonb not null default '{}'::jsonb,
  result_count integer not null default 0 check (result_count >= 0),
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.search_candidates (
  search_run_id uuid not null references public.search_runs(id) on delete cascade,
  property_id text not null references public.properties(id) on delete cascade,
  rank smallint not null check (rank > 0),
  score numeric(6,5) check (score is null or (score >= 0 and score <= 1)),
  reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (search_run_id, property_id),
  unique (search_run_id, rank)
);

create table if not exists public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  status text not null default 'active',
  channel text not null default 'web',
  model text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint conversation_sessions_status check (status in ('active', 'completed', 'abandoned', 'escalated')),
  constraint conversation_sessions_channel check (channel in ('web', 'phone', 'whatsapp'))
);

create table if not exists public.conversation_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.conversation_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text,
  content_blocks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint conversation_messages_content check (content is not null or jsonb_array_length(content_blocks) > 0)
);

create table if not exists public.tool_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.conversation_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  tool_name text not null check (char_length(tool_name) between 2 and 120),
  arguments jsonb not null default '{}'::jsonb,
  result_summary jsonb,
  status text not null default 'started',
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint tool_runs_status check (status in ('started', 'succeeded', 'failed', 'rejected'))
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  property_id text references public.properties(id) on delete set null,
  session_id uuid references public.conversation_sessions(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text,
  phone text,
  message text,
  consent_at timestamptz not null,
  status text not null default 'new',
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiries_contact check (email is not null or phone is not null),
  constraint inquiries_status check (status in ('new', 'qualified', 'contacted', 'viewing_booked', 'closed', 'spam'))
);

create index if not exists search_briefs_user_created_idx on public.search_briefs (user_id, created_at desc);
create index if not exists shortlist_items_user_created_idx on public.shortlist_items (user_id, created_at desc);
create index if not exists search_runs_user_created_idx on public.search_runs (user_id, created_at desc);
create index if not exists search_runs_org_created_idx on public.search_runs (organization_id, created_at desc);
create index if not exists search_candidates_run_rank_idx on public.search_candidates (search_run_id, rank);
create index if not exists conversation_sessions_user_started_idx on public.conversation_sessions (user_id, started_at desc);
create index if not exists conversation_sessions_org_started_idx on public.conversation_sessions (organization_id, started_at desc);
create index if not exists conversation_messages_session_created_idx on public.conversation_messages (session_id, created_at, id);
create index if not exists tool_runs_session_created_idx on public.tool_runs (session_id, created_at desc);
create index if not exists tool_runs_org_created_idx on public.tool_runs (organization_id, created_at desc);
create index if not exists inquiries_org_status_created_idx on public.inquiries (organization_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Shared server-only abuse controls
-- ---------------------------------------------------------------------------

create table if not exists public.api_rate_limits (
  scope text not null check (scope in ('gemini-live-token', 'gemini-voice-turn', 'agent-tool')),
  bucket_key text not null check (bucket_key ~ '^[a-f0-9]{64}$'),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (scope, bucket_key)
);

alter table public.api_rate_limits drop constraint if exists api_rate_limits_scope_check;
alter table public.api_rate_limits add constraint api_rate_limits_scope_check
  check (scope in ('gemini-live-token', 'gemini-voice-turn', 'agent-tool'));

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
  if p_scope not in ('gemini-live-token', 'gemini-voice-turn', 'agent-tool') then
    raise exception 'Unsupported rate-limit scope';
  end if;
  if p_bucket_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate-limit bucket';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'Invalid rate-limit window';
  end if;
  if p_max_requests < 1 or p_max_requests > 100 then
    raise exception 'Invalid rate-limit maximum';
  end if;

  insert into public.api_rate_limits (scope, bucket_key, request_count, window_started_at, expires_at)
  values (p_scope, p_bucket_key, 1, current_time, current_time + make_interval(secs => p_window_seconds))
  on conflict (scope, bucket_key) do update set
    request_count = case when public.api_rate_limits.expires_at <= current_time then 1 else public.api_rate_limits.request_count + 1 end,
    window_started_at = case when public.api_rate_limits.expires_at <= current_time then current_time else public.api_rate_limits.window_started_at end,
    expires_at = case when public.api_rate_limits.expires_at <= current_time then current_time + make_interval(secs => p_window_seconds) else public.api_rate_limits.expires_at end
  returning request_count, expires_at into current_count, current_reset;

  return query select
    current_count <= p_max_requests,
    greatest(0, p_max_requests - current_count),
    current_reset;
end;
$$;

revoke all on table public.api_rate_limits from public, anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant select, insert, update, delete on table public.api_rate_limits to service_role;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.developments enable row level security;
alter table public.properties enable row level security;
alter table public.payment_plans enable row level security;
alter table public.payment_plan_installments enable row level security;
alter table public.floor_plans enable row level security;
alter table public.content_entries enable row level security;
alter table public.audit_events enable row level security;
alter table public.search_briefs enable row level security;
alter table public.shortlist_items enable row level security;
alter table public.search_runs enable row level security;
alter table public.search_candidates enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.tool_runs enable row level security;
alter table public.inquiries enable row level security;
alter table public.api_rate_limits enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.properties, public.developments, public.payment_plans,
  public.payment_plan_installments, public.floor_plans, public.content_entries to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.organizations, public.organization_memberships to authenticated;
grant insert, update, delete on public.developments, public.properties, public.payment_plans,
  public.payment_plan_installments, public.floor_plans, public.content_entries to authenticated;
grant insert on public.audit_events to authenticated;
grant select on public.audit_events to authenticated;
grant select, insert on public.search_briefs to authenticated;
grant select, insert, update, delete on public.shortlist_items to authenticated;
grant select, insert on public.search_runs, public.search_candidates,
  public.conversation_sessions, public.conversation_messages, public.tool_runs to authenticated;
grant select, insert, update on public.inquiries to authenticated;
grant usage, select on all sequences in schema public to authenticated, service_role;

drop policy if exists "Users read their profile" on public.profiles;
create policy "Users read their profile" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "Members read their organizations" on public.organizations;
create policy "Members read their organizations" on public.organizations for select to authenticated
  using (private.is_org_member(id));

drop policy if exists "Members read organization memberships" on public.organization_memberships;
create policy "Members read organization memberships" on public.organization_memberships for select to authenticated
  using (private.is_org_member(organization_id));

drop policy if exists "Public reads published developments" on public.developments;
create policy "Public reads published developments" on public.developments for select to anon, authenticated
  using (publication_status = 'published');
drop policy if exists "Members read organization developments" on public.developments;
create policy "Members read organization developments" on public.developments for select to authenticated
  using (private.is_org_member(organization_id));
drop policy if exists "Catalog managers create developments" on public.developments;
create policy "Catalog managers create developments" on public.developments for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
drop policy if exists "Catalog managers update developments" on public.developments;
create policy "Catalog managers update developments" on public.developments for update to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));
drop policy if exists "Admins delete draft developments" on public.developments;
create policy "Admins delete draft developments" on public.developments for delete to authenticated
  using (publication_status = 'draft' and private.has_org_role(organization_id, array['owner','admin']));

drop policy if exists "Illustrative properties are publicly readable" on public.properties;
drop policy if exists "Public reads available properties" on public.properties;
create policy "Public reads available properties" on public.properties for select to anon, authenticated
  using ((status = 'illustrative') or (publication_status = 'published' and availability_status = 'available'));
drop policy if exists "Members read organization properties" on public.properties;
create policy "Members read organization properties" on public.properties for select to authenticated
  using (organization_id is not null and private.is_org_member(organization_id));
drop policy if exists "Catalog managers create properties" on public.properties;
create policy "Catalog managers create properties" on public.properties for insert to authenticated
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
drop policy if exists "Catalog managers update properties" on public.properties;
create policy "Catalog managers update properties" on public.properties for update to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));
drop policy if exists "Admins delete draft properties" on public.properties;
create policy "Admins delete draft properties" on public.properties for delete to authenticated
  using (publication_status = 'draft' and organization_id is not null and private.has_org_role(organization_id, array['owner','admin']));

drop policy if exists "Public reads published payment plans" on public.payment_plans;
create policy "Public reads published payment plans" on public.payment_plans for select to anon, authenticated
  using (
    publication_status = 'published'
    and (
      (property_id is not null and exists (
        select 1 from public.properties property
        where property.id = property_id
          and (property.status = 'illustrative' or (property.publication_status = 'published' and property.availability_status = 'available'))
      ))
      or (development_id is not null and exists (
        select 1 from public.developments development
        where development.id = development_id and development.publication_status = 'published'
      ))
    )
  );
drop policy if exists "Members read organization payment plans" on public.payment_plans;
create policy "Members read organization payment plans" on public.payment_plans for select to authenticated
  using (private.is_org_member(organization_id));
drop policy if exists "Catalog managers write payment plans" on public.payment_plans;
create policy "Catalog managers write payment plans" on public.payment_plans for all to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));

drop policy if exists "Public reads published payment installments" on public.payment_plan_installments;
create policy "Public reads published payment installments" on public.payment_plan_installments for select to anon, authenticated
  using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and plan.publication_status = 'published'));
drop policy if exists "Members write payment installments" on public.payment_plan_installments;
create policy "Members write payment installments" on public.payment_plan_installments for all to authenticated
  using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and private.has_org_role(plan.organization_id, array['owner','admin','inventory_manager','editor'])))
  with check (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and private.has_org_role(plan.organization_id, array['owner','admin','inventory_manager','editor'])));

drop policy if exists "Public reads published floor plans" on public.floor_plans;
create policy "Public reads published floor plans" on public.floor_plans for select to anon, authenticated
  using (
    publication_status = 'published'
    and (
      (property_id is not null and exists (
        select 1 from public.properties property
        where property.id = property_id
          and (property.status = 'illustrative' or (property.publication_status = 'published' and property.availability_status = 'available'))
      ))
      or (development_id is not null and exists (
        select 1 from public.developments development
        where development.id = development_id and development.publication_status = 'published'
      ))
    )
  );
drop policy if exists "Members read organization floor plans" on public.floor_plans;
create policy "Members read organization floor plans" on public.floor_plans for select to authenticated
  using (private.is_org_member(organization_id));
drop policy if exists "Catalog managers write floor plans" on public.floor_plans;
create policy "Catalog managers write floor plans" on public.floor_plans for all to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));

drop policy if exists "Public reads published content" on public.content_entries;
create policy "Public reads published content" on public.content_entries for select to anon, authenticated
  using (publication_status = 'published');
drop policy if exists "Members read organization content" on public.content_entries;
create policy "Members read organization content" on public.content_entries for select to authenticated
  using (private.is_org_member(organization_id));
drop policy if exists "Editors write organization content" on public.content_entries;
create policy "Editors write organization content" on public.content_entries for all to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','editor']) and updated_by = (select auth.uid()));

drop policy if exists "Members read audit events" on public.audit_events;
create policy "Members read audit events" on public.audit_events for select to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor','analyst']));
drop policy if exists "Members append audit events" on public.audit_events;
create policy "Members append audit events" on public.audit_events for insert to authenticated
  with check (private.is_org_member(organization_id) and actor_user_id = (select auth.uid()));

drop policy if exists "Users read their search briefs" on public.search_briefs;
create policy "Users read their search briefs" on public.search_briefs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users create their search briefs" on public.search_briefs;
create policy "Users create their search briefs" on public.search_briefs for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Users read their shortlist" on public.shortlist_items;
create policy "Users read their shortlist" on public.shortlist_items for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users add to their shortlist" on public.shortlist_items;
create policy "Users add to their shortlist" on public.shortlist_items for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update their shortlist" on public.shortlist_items;
create policy "Users update their shortlist" on public.shortlist_items for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users remove from their shortlist" on public.shortlist_items;
create policy "Users remove from their shortlist" on public.shortlist_items for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Users read their search runs" on public.search_runs;
create policy "Users read their search runs" on public.search_runs for select to authenticated
  using (user_id = (select auth.uid()) or (organization_id is not null and private.is_org_member(organization_id)));
drop policy if exists "Users create their search runs" on public.search_runs;
create policy "Users create their search runs" on public.search_runs for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users read their search candidates" on public.search_candidates;
create policy "Users read their search candidates" on public.search_candidates for select to authenticated
  using (exists (select 1 from public.search_runs run where run.id = search_run_id and (run.user_id = (select auth.uid()) or (run.organization_id is not null and private.is_org_member(run.organization_id)))));
drop policy if exists "Users create their search candidates" on public.search_candidates;
create policy "Users create their search candidates" on public.search_candidates for insert to authenticated
  with check (exists (select 1 from public.search_runs run where run.id = search_run_id and run.user_id = (select auth.uid())));

drop policy if exists "Users read their conversation sessions" on public.conversation_sessions;
create policy "Users read their conversation sessions" on public.conversation_sessions for select to authenticated
  using (user_id = (select auth.uid()) or (organization_id is not null and private.is_org_member(organization_id)));
drop policy if exists "Users create conversation sessions" on public.conversation_sessions;
create policy "Users create conversation sessions" on public.conversation_sessions for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users read their conversation messages" on public.conversation_messages;
create policy "Users read their conversation messages" on public.conversation_messages for select to authenticated
  using (exists (select 1 from public.conversation_sessions session where session.id = session_id and (session.user_id = (select auth.uid()) or (session.organization_id is not null and private.is_org_member(session.organization_id)))));
drop policy if exists "Users create conversation messages" on public.conversation_messages;
create policy "Users create conversation messages" on public.conversation_messages for insert to authenticated
  with check (exists (select 1 from public.conversation_sessions session where session.id = session_id and session.user_id = (select auth.uid())));

drop policy if exists "Users read their tool runs" on public.tool_runs;
create policy "Users read their tool runs" on public.tool_runs for select to authenticated
  using (user_id = (select auth.uid()) or (organization_id is not null and private.has_org_role(organization_id, array['owner','admin','analyst'])));
drop policy if exists "Users create their tool runs" on public.tool_runs;
create policy "Users create their tool runs" on public.tool_runs for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Users read their inquiries" on public.inquiries;
create policy "Users read their inquiries" on public.inquiries for select to authenticated
  using (user_id = (select auth.uid()) or (organization_id is not null and private.is_org_member(organization_id)));
drop policy if exists "Users create inquiries" on public.inquiries;
create policy "Users create inquiries" on public.inquiries for insert to authenticated
  with check (user_id = (select auth.uid()));
drop policy if exists "Agents update organization inquiries" on public.inquiries;
create policy "Agents update organization inquiries" on public.inquiries for update to authenticated
  using (organization_id is not null and private.has_org_role(organization_id, array['owner','admin','agent']))
  with check (organization_id is not null and private.has_org_role(organization_id, array['owner','admin','agent']));

-- Keep timestamps server-controlled.
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations for each row execute function private.set_updated_at();
drop trigger if exists memberships_set_updated_at on public.organization_memberships;
create trigger memberships_set_updated_at before update on public.organization_memberships for each row execute function private.set_updated_at();
drop trigger if exists developments_set_updated_at on public.developments;
create trigger developments_set_updated_at before update on public.developments for each row execute function private.set_updated_at();
drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at before update on public.properties for each row execute function private.set_updated_at();
drop trigger if exists payment_plans_set_updated_at on public.payment_plans;
create trigger payment_plans_set_updated_at before update on public.payment_plans for each row execute function private.set_updated_at();
drop trigger if exists floor_plans_set_updated_at on public.floor_plans;
create trigger floor_plans_set_updated_at before update on public.floor_plans for each row execute function private.set_updated_at();
drop trigger if exists content_entries_set_updated_at on public.content_entries;
create trigger content_entries_set_updated_at before update on public.content_entries for each row execute function private.set_updated_at();
drop trigger if exists inquiries_set_updated_at on public.inquiries;
create trigger inquiries_set_updated_at before update on public.inquiries for each row execute function private.set_updated_at();

-- Seed only clearly labelled sample inventory. Production connectors must replace it.
insert into public.properties (
  id, name, location, price_aed, beds, baths, area_sq_ft, feature,
  match_reason, image_url, image_alt, status, publication_status, property_type,
  completion_status, availability_status, updated_at
) values
  (
    'marina-promenade-residence', 'Marina Promenade Residence', 'Dubai Marina',
    2800000, 2, 2, 1420, 'Balcony · Marina walk',
    'Strong alignment with the waterfront, walkability, and two-bedroom brief.',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=85&w=1200',
    'Illustrative contemporary residence with an open garden-facing living space',
    'illustrative', 'draft', 'apartment', 'ready', 'available', now()
  ),
  (
    'boulevard-garden-apartment', 'Boulevard Garden Apartment', 'Downtown Dubai',
    3000000, 2, 2, 1360, 'Natural light · Study nook',
    'Closest sample for central access, morning light, and flexible work space.',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=85&w=1200',
    'Illustrative bright contemporary apartment interior with full-height windows',
    'illustrative', 'draft', 'apartment', 'ready', 'available', now()
  ),
  (
    'palm-courtyard-residence', 'Palm Courtyard Residence', 'Palm Jumeirah',
    2950000, 2, 2, 1510, 'Terrace · Quieter setting',
    'A calmer lifestyle sample with outdoor space and convenient water access.',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=85&w=1200',
    'Illustrative modern residence with a private terrace and warm stone facade',
    'illustrative', 'draft', 'apartment', 'ready', 'available', now()
  )
on conflict (id) do update set
  name = excluded.name,
  location = excluded.location,
  price_aed = excluded.price_aed,
  beds = excluded.beds,
  baths = excluded.baths,
  area_sq_ft = excluded.area_sq_ft,
  feature = excluded.feature,
  match_reason = excluded.match_reason,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  status = case when public.properties.organization_id is null then 'illustrative' else public.properties.status end,
  updated_at = now();
