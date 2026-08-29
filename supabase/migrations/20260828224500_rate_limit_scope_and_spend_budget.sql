-- Keep every server allowlist in sync with the atomic shared limiter and add a
-- global daily Gemini Live session budget. Client roles retain no direct access.

alter table public.api_rate_limits drop constraint if exists api_rate_limits_scope_check;
alter table public.api_rate_limits add constraint api_rate_limits_scope_check
  check (scope in (
    'gemini-live-token',
    'gemini-live-daily',
    'gemini-voice-turn',
    'agent-tool',
    'property-search',
    'prepare-brief',
    'decision-ledger',
    'buyer-deletion-verification',
    'voice-telemetry'
  )) not valid;

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
  v_now timestamptz := clock_timestamp();
  v_count integer;
  v_reset_at timestamptz;
begin
  if p_scope not in (
    'gemini-live-token',
    'gemini-live-daily',
    'gemini-voice-turn',
    'agent-tool',
    'property-search',
    'prepare-brief',
    'decision-ledger',
    'buyer-deletion-verification',
    'voice-telemetry'
  ) then
    raise exception 'Unsupported rate-limit scope';
  end if;
  if p_bucket_key !~ '^[a-f0-9]{64}$' then raise exception 'Invalid rate-limit bucket'; end if;
  if p_window_seconds < 1 or p_window_seconds > 86400 then raise exception 'Invalid rate-limit window'; end if;
  if p_max_requests < 1 or p_max_requests > 10000 then raise exception 'Invalid rate-limit maximum'; end if;

  insert into public.api_rate_limits (scope, bucket_key, request_count, window_started_at, expires_at)
  values (p_scope, p_bucket_key, 1, v_now, v_now + make_interval(secs => p_window_seconds))
  on conflict (scope, bucket_key) do update set
    request_count = case when public.api_rate_limits.expires_at <= v_now then 1 else public.api_rate_limits.request_count + 1 end,
    window_started_at = case when public.api_rate_limits.expires_at <= v_now then v_now else public.api_rate_limits.window_started_at end,
    expires_at = case when public.api_rate_limits.expires_at <= v_now then v_now + make_interval(secs => p_window_seconds) else public.api_rate_limits.expires_at end
  returning request_count, expires_at into v_count, v_reset_at;

  return query select v_count <= p_max_requests, greatest(0, p_max_requests - v_count), v_reset_at;
end;
$$;

revoke all on table public.api_rate_limits from public, anon, authenticated;
revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant select, insert, update, delete on table public.api_rate_limits to service_role;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer) to service_role;
