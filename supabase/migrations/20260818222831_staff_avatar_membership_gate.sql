-- Match direct Storage access to the server action's staff-only boundary.
create or replace function private.is_active_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships as membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any (
        array['owner', 'admin', 'inventory_manager', 'editor', 'agent', 'analyst', 'viewer']
      )
  );
$$;

revoke all on function private.is_active_staff() from public;
grant execute on function private.is_active_staff() to authenticated, service_role;

drop policy if exists "Staff read their avatar objects" on storage.objects;
create policy "Staff read their avatar objects"
on storage.objects for select to authenticated
using (
  private.is_active_staff()
  and bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Staff create their avatar objects" on storage.objects;
create policy "Staff create their avatar objects"
on storage.objects for insert to authenticated
with check (
  private.is_active_staff()
  and bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Staff update their avatar objects" on storage.objects;
create policy "Staff update their avatar objects"
on storage.objects for update to authenticated
using (
  private.is_active_staff()
  and bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  private.is_active_staff()
  and bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Staff delete their avatar objects" on storage.objects;
create policy "Staff delete their avatar objects"
on storage.objects for delete to authenticated
using (
  private.is_active_staff()
  and bucket_id = 'staff-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
