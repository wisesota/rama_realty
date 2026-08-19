-- Close the final hosted advisor findings after the Decision Room foundation.

create index if not exists buyer_sessions_user_idx on public.buyer_sessions (user_id) where user_id is not null;
create index if not exists buyer_shortlist_items_property_idx on public.buyer_shortlist_items (property_id);
create index if not exists conversation_sessions_buyer_idx on public.conversation_sessions (buyer_session_id) where buyer_session_id is not null;
create index if not exists crm_outbox_org_idx on public.crm_outbox (organization_id);
create index if not exists inquiries_search_run_idx on public.inquiries (search_run_id) where search_run_id is not null;
create index if not exists property_documents_created_by_idx on public.property_documents (created_by) where created_by is not null;
create index if not exists property_documents_org_idx on public.property_documents (organization_id);
create index if not exists property_documents_updated_by_idx on public.property_documents (updated_by) where updated_by is not null;
create index if not exists search_runs_buyer_idx on public.search_runs (buyer_session_id) where buyer_session_id is not null;
create index if not exists search_runs_conversation_idx on public.search_runs (conversation_id) where conversation_id is not null;
create index if not exists tool_runs_buyer_idx on public.tool_runs (buyer_session_id) where buyer_session_id is not null;

drop policy if exists "Service-only buyer sessions" on public.buyer_sessions;
create policy "Service-only buyer sessions" on public.buyer_sessions for all to anon, authenticated using (false) with check (false);
drop policy if exists "Service-only buyer shortlist" on public.buyer_shortlist_items;
create policy "Service-only buyer shortlist" on public.buyer_shortlist_items for all to anon, authenticated using (false) with check (false);
drop policy if exists "Service-only CRM outbox" on public.crm_outbox;
create policy "Service-only CRM outbox" on public.crm_outbox for all to anon, authenticated using (false) with check (false);

-- One policy per role/action keeps the staff and public read paths explicit.
drop policy if exists "Guests read published payment plans" on public.payment_plans;
drop policy if exists "Authenticated users read visible payment plans" on public.payment_plans;
drop policy if exists "Public reads published payment plans" on public.payment_plans;
create policy "Public reads published payment plans" on public.payment_plans for select to anon
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
create policy "Authenticated users read governed payment plans" on public.payment_plans for select to authenticated
using (
  private.is_org_member(organization_id)
  or (
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
  )
);

drop policy if exists "Guests read published payment installments" on public.payment_plan_installments;
drop policy if exists "Authenticated users read visible payment installments" on public.payment_plan_installments;
drop policy if exists "Public reads published payment installments" on public.payment_plan_installments;
create policy "Public reads published payment installments" on public.payment_plan_installments for select to anon
using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id
  and plan.publication_status = 'published'
  and plan.source_updated_at >= now() - interval '30 days'
  and (plan.publication_ends_at is null or plan.publication_ends_at > now())));
create policy "Authenticated users read governed payment installments" on public.payment_plan_installments for select to authenticated
using (exists (select 1 from public.payment_plans plan where plan.id = payment_plan_id and (
  private.is_org_member(plan.organization_id)
  or (plan.publication_status = 'published' and plan.source_updated_at >= now() - interval '30 days' and (plan.publication_ends_at is null or plan.publication_ends_at > now()))
)));

drop policy if exists "Guests read published floor plans" on public.floor_plans;
drop policy if exists "Authenticated users read visible floor plans" on public.floor_plans;
drop policy if exists "Public reads published floor plans" on public.floor_plans;
create policy "Public reads published floor plans" on public.floor_plans for select to anon
using (
  publication_status = 'published'
  and source_updated_at >= now() - interval '30 days'
  and (publication_ends_at is null or publication_ends_at > now())
  and (
    (property_id is not null and exists (select 1 from public.public_property_catalog property where property.id = property_id))
    or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id and development.publication_status = 'published' and development.source_updated_at >= now() - interval '30 days' and (development.publication_ends_at is null or development.publication_ends_at > now())))
  )
);
create policy "Authenticated users read governed floor plans" on public.floor_plans for select to authenticated
using (
  private.is_org_member(organization_id)
  or (
    publication_status = 'published'
    and source_updated_at >= now() - interval '30 days'
    and (publication_ends_at is null or publication_ends_at > now())
    and (
      (property_id is not null and exists (select 1 from public.public_property_catalog property where property.id = property_id))
      or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id and development.publication_status = 'published' and development.source_updated_at >= now() - interval '30 days' and (development.publication_ends_at is null or development.publication_ends_at > now())))
    )
  )
);

drop policy if exists "Public reads published property documents" on public.property_documents;
drop policy if exists "Members manage property documents" on public.property_documents;
create policy "Public reads published property documents" on public.property_documents for select to anon
using (
  publication_status = 'published'
  and source_updated_at >= now() - interval '30 days'
  and (publication_ends_at is null or publication_ends_at > now())
  and (
    (property_id is not null and exists (select 1 from public.public_property_catalog property where property.id = property_id))
    or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id and development.publication_status = 'published' and development.source_updated_at >= now() - interval '30 days' and (development.publication_ends_at is null or development.publication_ends_at > now())))
  )
);
create policy "Authenticated users read governed property documents" on public.property_documents for select to authenticated
using (
  private.is_org_member(organization_id)
  or (
    publication_status = 'published'
    and source_updated_at >= now() - interval '30 days'
    and (publication_ends_at is null or publication_ends_at > now())
    and (
      (property_id is not null and exists (select 1 from public.public_property_catalog property where property.id = property_id))
      or (development_id is not null and exists (select 1 from public.developments development where development.id = development_id and development.publication_status = 'published' and development.source_updated_at >= now() - interval '30 days' and (development.publication_ends_at is null or development.publication_ends_at > now())))
    )
  )
);
create policy "Members create property documents" on public.property_documents for insert to authenticated
with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and created_by = (select auth.uid()) and updated_by = (select auth.uid()));
create policy "Members update property documents" on public.property_documents for update to authenticated
using (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']))
with check (private.has_org_role(organization_id, array['owner','admin','inventory_manager','editor']) and updated_by = (select auth.uid()));
create policy "Members delete property documents" on public.property_documents for delete to authenticated
using (private.has_org_role(organization_id, array['owner','admin','inventory_manager']));

-- The browser never invokes a security-definer transition. The server passes a
-- verified actor through this service-role-only adapter, which rechecks tenancy.
drop function if exists public.transition_inquiry(uuid, text, uuid);
create or replace function public.transition_inquiry_service(
  p_actor_id uuid,
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
  current_row public.inquiries;
  updated_row public.inquiries;
begin
  if p_actor_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  select * into current_row from public.inquiries where id = p_inquiry_id for update;
  if current_row.id is null or not exists (
    select 1 from public.organization_memberships membership
    where membership.organization_id = current_row.organization_id
      and membership.user_id = p_actor_id
      and membership.status = 'active'
      and membership.role in ('owner','admin','agent')
  ) then raise exception 'Inquiry not found' using errcode = '42501'; end if;
  if p_status not in ('new','qualified','contacted','viewing_booked','closed','spam') then raise exception 'Invalid inquiry status' using errcode = '23514'; end if;
  update public.inquiries set status = p_status, assigned_to = p_assigned_to where id = p_inquiry_id returning * into updated_row;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, before_state, after_state, correlation_id)
  values (updated_row.organization_id, p_actor_id, 'inquiry.transitioned', 'inquiry', updated_row.id::text,
    jsonb_build_object('status', current_row.status, 'assigned_to', current_row.assigned_to),
    jsonb_build_object('status', updated_row.status, 'assigned_to', updated_row.assigned_to),
    updated_row.correlation_id);
  return updated_row;
end;
$$;
revoke all on function public.transition_inquiry_service(uuid, uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.transition_inquiry_service(uuid, uuid, text, uuid) to service_role;
