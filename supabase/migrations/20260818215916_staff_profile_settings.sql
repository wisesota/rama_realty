-- Staff profile preferences and private avatar storage.
-- The public profile row remains self-owned through the existing RLS policies.

alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists timezone text not null default 'Asia/Dubai',
  add column if not exists locale text not null default 'en';

alter table public.profiles
  drop constraint if exists profiles_avatar_path_owner,
  add constraint profiles_avatar_path_owner check (
    avatar_path is null or avatar_path like id::text || '/%'
  ),
  drop constraint if exists profiles_timezone_supported,
  add constraint profiles_timezone_supported check (
    timezone = any (array['Asia/Dubai', 'Etc/UTC', 'Europe/London', 'America/New_York'])
  ),
  drop constraint if exists profiles_locale_supported,
  add constraint profiles_locale_supported check (locale = any (array['en', 'ar']));

-- Accounts created before the profile trigger was installed still receive a row.
insert into public.profiles (id, full_name, avatar_url)
select
  users.id,
  nullif(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name'), ''),
  nullif(coalesce(users.raw_user_meta_data ->> 'avatar_url', users.raw_user_meta_data ->> 'picture'), '')
from auth.users as users
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-avatars',
  'staff-avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Staff read their avatar objects" on storage.objects;
create policy "Staff read their avatar objects"
on storage.objects for select to authenticated
using (
  bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Staff create their avatar objects" on storage.objects;
create policy "Staff create their avatar objects"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Staff update their avatar objects" on storage.objects;
create policy "Staff update their avatar objects"
on storage.objects for update to authenticated
using (
  bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Staff delete their avatar objects" on storage.objects;
create policy "Staff delete their avatar objects"
on storage.objects for delete to authenticated
using (
  bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
