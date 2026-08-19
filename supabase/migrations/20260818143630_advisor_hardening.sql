-- Resolve security and performance advisor findings from the enterprise foundation.

create or replace function private.can_create_workspace()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and not exists (
      select 1 from public.organization_memberships membership
      where membership.user_id = (select auth.uid()) and membership.status = 'active'
    )
    and not exists (
      select 1 from public.organizations organization
      where organization.created_by = (select auth.uid())
    );
$$;

create or replace function private.can_claim_workspace(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations organization
    where organization.id = p_organization_id
      and organization.created_by = (select auth.uid())
  )
  and not exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = p_organization_id
  );
$$;

revoke all on function private.can_create_workspace() from public, anon;
revoke all on function private.can_claim_workspace(uuid) from public, anon;
grant execute on function private.can_create_workspace() to authenticated, service_role;
grant execute on function private.can_claim_workspace(uuid) to authenticated, service_role;

grant insert on public.organizations, public.organization_memberships to authenticated;

drop policy if exists "Users create their first workspace" on public.organizations;
create policy "Users create their first workspace"
  on public.organizations for insert to authenticated
  with check (created_by = (select auth.uid()) and private.can_create_workspace());

drop policy if exists "Users claim their first workspace" on public.organization_memberships;
create policy "Users claim their first workspace"
  on public.organization_memberships for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and role = 'owner'
    and status = 'active'
    and invited_by is null
    and private.can_claim_workspace(organization_id)
  );

create or replace function public.bootstrap_staff_workspace(p_name text, p_slug text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  workspace_id uuid := gen_random_uuid();
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
  if not private.can_create_workspace() then
    raise exception 'User already owns or belongs to a workspace';
  end if;

  insert into public.organizations (id, name, slug, created_by)
  values (workspace_id, normalized_name, normalized_slug, caller_id);

  insert into public.organization_memberships (organization_id, user_id, role, status)
  values (workspace_id, caller_id, 'owner', 'active');

  return workspace_id;
end;
$$;

drop policy if exists "Client roles cannot access rate limits" on public.api_rate_limits;
create policy "Client roles cannot access rate limits"
  on public.api_rate_limits for all to anon, authenticated
  using (false) with check (false);

-- Foreign-key indexes used by deletes, joins, authorship views, and audit queries.
create index if not exists organizations_created_by_idx on public.organizations (created_by);
create index if not exists memberships_invited_by_idx on public.organization_memberships (invited_by) where invited_by is not null;
create index if not exists developments_created_by_idx on public.developments (created_by);
create index if not exists developments_updated_by_idx on public.developments (updated_by);
create index if not exists properties_created_by_idx on public.properties (created_by) where created_by is not null;
create index if not exists properties_updated_by_idx on public.properties (updated_by) where updated_by is not null;
create index if not exists payment_plans_created_by_idx on public.payment_plans (created_by);
create index if not exists payment_plans_updated_by_idx on public.payment_plans (updated_by);
create index if not exists floor_plans_created_by_idx on public.floor_plans (created_by);
create index if not exists floor_plans_updated_by_idx on public.floor_plans (updated_by);
create index if not exists content_entries_created_by_idx on public.content_entries (created_by);
create index if not exists content_entries_updated_by_idx on public.content_entries (updated_by);
create index if not exists audit_events_actor_idx on public.audit_events (actor_user_id) where actor_user_id is not null;
create index if not exists shortlist_items_property_idx on public.shortlist_items (property_id);
create index if not exists search_candidates_property_idx on public.search_candidates (property_id);
create index if not exists tool_runs_user_idx on public.tool_runs (user_id) where user_id is not null;
create index if not exists inquiries_user_idx on public.inquiries (user_id) where user_id is not null;
create index if not exists inquiries_property_idx on public.inquiries (property_id) where property_id is not null;
create index if not exists inquiries_session_idx on public.inquiries (session_id) where session_id is not null;
create index if not exists inquiries_assigned_to_idx on public.inquiries (assigned_to) where assigned_to is not null;

-- Consolidate SELECT policies so authenticated requests evaluate one policy per table.
drop policy if exists "Public reads published developments" on public.developments;
drop policy if exists "Members read organization developments" on public.developments;
create policy "Guests read published developments" on public.developments for select to anon
  using (publication_status = 'published');
create policy "Authenticated users read visible developments" on public.developments for select to authenticated
  using (publication_status = 'published' or private.is_org_member(organization_id));

drop policy if exists "Public reads available properties" on public.properties;
drop policy if exists "Members read organization properties" on public.properties;
create policy "Guests read available properties" on public.properties for select to anon
  using (status = 'illustrative' or (publication_status = 'published' and availability_status = 'available'));
create policy "Authenticated users read visible properties" on public.properties for select to authenticated
  using (
    status = 'illustrative'
    or (publication_status = 'published' and availability_status = 'available')
    or (organization_id is not null and private.is_org_member(organization_id))
  );

drop policy if exists "Public reads published payment plans" on public.payment_plans;
drop policy if exists "Members read organization payment plans" on public.payment_plans;
drop policy if exists "Catalog managers write payment plans" on public.payment_plans;
create policy "Guests read published payment plans" on public.payment_plans for select to anon
  using (
    publication_status = 'published'
    and (
      (property_id is not null and exists (select 1 from public.properties property where property.id = property_id))
      or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id))
    )
  );
create policy "Authenticated users read visible payment plans" on public.payment_plans for select to authenticated
  using (
    private.is_org_member(organization_id)
    or (
      publication_status = 'published'
      and (
        (property_id is not null and exists (select 1 from public.properties property where property.id = property_id))
        or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id))
      )
    )
  );
create policy "Catalog managers create payment plans" on public.payment_plans for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Catalog managers update payment plans" on public.payment_plans for update to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));
create policy "Catalog managers delete payment plans" on public.payment_plans for delete to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager']));

drop policy if exists "Public reads published payment installments" on public.payment_plan_installments;
drop policy if exists "Members write payment installments" on public.payment_plan_installments;
create policy "Guests read published payment installments" on public.payment_plan_installments for select to anon
  using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id));
create policy "Authenticated users read visible payment installments" on public.payment_plan_installments for select to authenticated
  using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id));
create policy "Catalog managers create payment installments" on public.payment_plan_installments for insert to authenticated
  with check (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and private.has_org_role(plan.organization_id, array['owner','admin','inventory_manager','editor'])));
create policy "Catalog managers update payment installments" on public.payment_plan_installments for update to authenticated
  using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and private.has_org_role(plan.organization_id, array['owner','admin','inventory_manager','editor'])))
  with check (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and private.has_org_role(plan.organization_id, array['owner','admin','inventory_manager','editor'])));
create policy "Catalog managers delete payment installments" on public.payment_plan_installments for delete to authenticated
  using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and private.has_org_role(plan.organization_id, array['owner','admin','inventory_manager'])));

drop policy if exists "Public reads published floor plans" on public.floor_plans;
drop policy if exists "Members read organization floor plans" on public.floor_plans;
drop policy if exists "Catalog managers write floor plans" on public.floor_plans;
create policy "Guests read published floor plans" on public.floor_plans for select to anon
  using (
    publication_status = 'published'
    and (
      (property_id is not null and exists (select 1 from public.properties property where property.id = property_id))
      or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id))
    )
  );
create policy "Authenticated users read visible floor plans" on public.floor_plans for select to authenticated
  using (
    private.is_org_member(organization_id)
    or (
      publication_status = 'published'
      and (
        (property_id is not null and exists (select 1 from public.properties property where property.id = property_id))
        or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id))
      )
    )
  );
create policy "Catalog managers create floor plans" on public.floor_plans for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Catalog managers update floor plans" on public.floor_plans for update to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));
create policy "Catalog managers delete floor plans" on public.floor_plans for delete to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','inventory_manager']));

drop policy if exists "Public reads published content" on public.content_entries;
drop policy if exists "Members read organization content" on public.content_entries;
drop policy if exists "Editors write organization content" on public.content_entries;
create policy "Guests read published content" on public.content_entries for select to anon
  using (publication_status = 'published');
create policy "Authenticated users read visible content" on public.content_entries for select to authenticated
  using (publication_status = 'published' or private.is_org_member(organization_id));
create policy "Editors create organization content" on public.content_entries for insert to authenticated
  with check (private.has_org_role(organization_id, array['owner','admin','editor']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Editors update organization content" on public.content_entries for update to authenticated
  using (private.has_org_role(organization_id, array['owner','admin','editor']))
  with check (private.has_org_role(organization_id, array['owner','admin','editor']) and updated_by = (select auth.uid()));
create policy "Editors delete organization content" on public.content_entries for delete to authenticated
  using (private.has_org_role(organization_id, array['owner','admin']));
