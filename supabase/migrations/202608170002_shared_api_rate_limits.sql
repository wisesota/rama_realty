-- Atomic shared abuse controls for paid public API boundaries.
-- Bucket keys are HMAC digests produced by the server; raw client addresses are not stored.

create table if not exists public.api_rate_limits (
  scope text not null check (scope in ('gemini-live-token', 'gemini-voice-turn')),
  bucket_key text not null check (bucket_key ~ '^[a-f0-9]{64}$'),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (scope, bucket_key)
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_scope text,
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_time timestamptz := clock_timestamp();
  current_count integer;
  current_reset timestamptz;
begin
  if p_scope not in ('gemini-live-token', 'gemini-voice-turn') then
    raise exception 'Unsupported rate-limit scope';
  end if;
  if p_bucket_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid rate-limit bucket';
  end if;
  if p_window_seconds < 1 or p_window_seconds > 3600 then
    raise exception 'Invalid rate-limit window';
  end if;
  if p_max_requests < 1 or p_max_requests > 100 then
    raise exception 'Invalid rate-limit maximum';
  end if;

  insert into public.api_rate_limits (
    scope,
    bucket_key,
    request_count,
    window_started_at,
    expires_at
  ) values (
    p_scope,
    p_bucket_key,
    1,
    current_time,
    current_time + make_interval(secs => p_window_seconds)
  )
  on conflict (scope, bucket_key) do update set
    request_count = case
      when api_rate_limits.expires_at <= current_time then 1
      else api_rate_limits.request_count + 1
    end,
    window_started_at = case
      when api_rate_limits.expires_at <= current_time then current_time
      else api_rate_limits.window_started_at
    end,
    expires_at = case
      when api_rate_limits.expires_at <= current_time
        then current_time + make_interval(secs => p_window_seconds)
      else api_rate_limits.expires_at
    end
  returning request_count, expires_at into current_count, current_reset;

  return query select
    current_count <= p_max_requests,
    greatest(0, p_max_requests - current_count),
    current_reset;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_api_rate_limit(text, text, integer, integer)
  to anon, authenticated;

