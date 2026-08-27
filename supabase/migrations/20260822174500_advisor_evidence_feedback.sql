create table if not exists public.advisor_evidence_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  search_run_id uuid references public.search_runs(id) on delete set null,
  property_id text references public.properties(id) on delete set null,
  category text not null,
  outcome text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint advisor_feedback_category_check check (category in ('missing_evidence','wrong_criterion','stale_source','handoff_outcome')),
  constraint advisor_feedback_outcome_check check (outcome is null or outcome in ('useful','needs_follow_up','not_a_fit','contacted','viewing_booked','closed')),
  constraint advisor_feedback_notes_check check (notes is null or char_length(notes) <= 1000)
);

create index if not exists advisor_feedback_org_time_idx
  on public.advisor_evidence_feedback (organization_id, created_at desc);
create index if not exists advisor_feedback_run_category_idx
  on public.advisor_evidence_feedback (search_run_id, category, created_at desc);

alter table public.advisor_evidence_feedback enable row level security;
revoke all on public.advisor_evidence_feedback from public, anon, authenticated;
grant select, insert on public.advisor_evidence_feedback to service_role;

create or replace function public.create_advisor_evidence_feedback(
  p_actor_id uuid,
  p_inquiry_id uuid,
  p_category text,
  p_outcome text,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  inquiry public.inquiries%rowtype;
  feedback_id uuid;
begin
  if p_actor_id is distinct from auth.uid() then raise exception 'Actor mismatch' using errcode = '42501'; end if;
  select * into inquiry from public.inquiries where id = p_inquiry_id;
  if not found or not private.has_org_role(inquiry.organization_id, array['owner','admin','agent']) then
    raise exception 'Inquiry is unavailable' using errcode = '42501';
  end if;
  if p_category not in ('missing_evidence','wrong_criterion','stale_source','handoff_outcome')
    or (nullif(btrim(p_outcome), '') is not null and btrim(p_outcome) not in ('useful','needs_follow_up','not_a_fit','contacted','viewing_booked','closed'))
    or char_length(coalesce(p_notes, '')) > 1000
  then raise exception 'Invalid feedback' using errcode = '22023'; end if;

  insert into public.advisor_evidence_feedback (
    organization_id, inquiry_id, search_run_id, property_id, category, outcome, notes, created_by
  ) values (
    inquiry.organization_id, inquiry.id, inquiry.search_run_id, inquiry.property_id,
    p_category, nullif(btrim(p_outcome), ''), nullif(btrim(p_notes), ''), p_actor_id
  ) returning id into feedback_id;
  return feedback_id;
end;
$$;

revoke all on function public.create_advisor_evidence_feedback(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_advisor_evidence_feedback(uuid, uuid, text, text, text)
  to authenticated;
