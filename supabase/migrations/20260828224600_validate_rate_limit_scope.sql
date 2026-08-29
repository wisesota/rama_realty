-- Validate the replacement allowlist separately so adding it does not scan the
-- table while holding the stronger ALTER TABLE lock.

alter table public.api_rate_limits validate constraint api_rate_limits_scope_check;
