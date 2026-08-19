-- Rama Realty search foundation. Apply to a development project first.
-- Raw voice audio is intentionally not stored.

create table if not exists public.properties (
  id text primary key,
  name text not null check (char_length(name) between 2 and 120),
  location text not null check (char_length(location) between 2 and 120),
  price_aed integer not null check (price_aed > 0),
  beds smallint not null check (beds between 0 and 30),
  baths smallint not null check (baths between 0 and 30),
  area_sq_ft integer not null check (area_sq_ft > 0),
  feature text not null check (char_length(feature) between 2 and 240),
  match_reason text not null check (char_length(match_reason) between 2 and 500),
  image_url text not null,
  image_alt text not null check (char_length(image_alt) between 2 and 300),
  status text not null default 'illustrative' check (status = 'illustrative'),
  created_at timestamptz not null default now()
);

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

create index if not exists search_briefs_user_created_idx
  on public.search_briefs (user_id, created_at desc);
create index if not exists shortlist_items_user_created_idx
  on public.shortlist_items (user_id, created_at desc);

alter table public.properties enable row level security;
alter table public.search_briefs enable row level security;
alter table public.shortlist_items enable row level security;

revoke all on public.properties from anon, authenticated;
grant select on public.properties to anon, authenticated;
revoke all on public.search_briefs from anon, authenticated;
grant select, insert on public.search_briefs to authenticated;
revoke all on public.shortlist_items from anon, authenticated;
grant select, insert, update, delete on public.shortlist_items to authenticated;

drop policy if exists "Illustrative properties are publicly readable" on public.properties;
create policy "Illustrative properties are publicly readable"
  on public.properties for select
  to anon, authenticated
  using (status = 'illustrative');

drop policy if exists "Users read their search briefs" on public.search_briefs;
create policy "Users read their search briefs"
  on public.search_briefs for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their search briefs" on public.search_briefs;
create policy "Users create their search briefs"
  on public.search_briefs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users read their shortlist" on public.shortlist_items;
create policy "Users read their shortlist"
  on public.shortlist_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users add to their shortlist" on public.shortlist_items;
create policy "Users add to their shortlist"
  on public.shortlist_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users remove from their shortlist" on public.shortlist_items;
create policy "Users remove from their shortlist"
  on public.shortlist_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

insert into public.properties (
  id, name, location, price_aed, beds, baths, area_sq_ft, feature,
  match_reason, image_url, image_alt
) values
  (
    'marina-promenade-residence', 'Marina Promenade Residence', 'Dubai Marina',
    2800000, 2, 2, 1420, 'Balcony · Marina walk',
    'Strong alignment with the waterfront, walkability, and two-bedroom brief.',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=85&w=1200',
    'Illustrative contemporary residence with an open garden-facing living space'
  ),
  (
    'boulevard-garden-apartment', 'Boulevard Garden Apartment', 'Downtown Dubai',
    3000000, 2, 2, 1360, 'Natural light · Study nook',
    'Closest sample for central access, morning light, and flexible work space.',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=85&w=1200',
    'Illustrative bright contemporary apartment interior with full-height windows'
  ),
  (
    'palm-courtyard-residence', 'Palm Courtyard Residence', 'Palm Jumeirah',
    2950000, 2, 2, 1510, 'Terrace · Quieter setting',
    'A calmer lifestyle sample with outdoor space and convenient water access.',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=85&w=1200',
    'Illustrative modern residence with a private terrace and warm stone facade'
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
  image_alt = excluded.image_alt;
