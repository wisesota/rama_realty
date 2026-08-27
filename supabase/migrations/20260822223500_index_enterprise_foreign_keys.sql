-- Foreign-key indexes keep deletion, reconciliation, evidence, and advisor
-- joins from degrading into sequential scans as enterprise data grows.

create index if not exists advisor_feedback_created_by_idx
  on public.advisor_evidence_feedback (created_by);
create index if not exists advisor_feedback_inquiry_idx
  on public.advisor_evidence_feedback (inquiry_id);
create index if not exists advisor_feedback_property_idx
  on public.advisor_evidence_feedback (property_id);

create index if not exists evidence_assertions_buyer_session_idx
  on public.evidence_assertions (buyer_session_id);
create index if not exists evidence_assertions_property_idx
  on public.evidence_assertions (property_id);

create index if not exists properties_provider_source_idx
  on public.properties (provider_source_id);
create index if not exists provider_reconciliation_source_idx
  on public.provider_reconciliation_events (provider_source_id);
create index if not exists provider_staging_published_property_idx
  on public.provider_records_staging (published_property_id);
