-- `upsert` may take the UPDATE path when a property is already shortlisted.
-- Preserve the same owner boundary on that path.

drop policy if exists "Users update their shortlist" on public.shortlist_items;
create policy "Users update their shortlist"
  on public.shortlist_items for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

