-- Issue #31: deployment-wide throttling for the anonymous self check-in edge.
-- The stored key is a one-way digest produced by the application from the
-- request origin and token. Raw IP addresses, tokens and participant data are
-- never persisted here.

create table private.check_in_rate_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  constraint check_in_rate_limits_fingerprint_check
    check (fingerprint ~ '^[0-9a-f]{64}$')
);

revoke all on table private.check_in_rate_limits from public, anon, authenticated;

create or replace function public.consume_check_in_rate_limit(
  source_fingerprint text,
  maximum_attempts integer default 10,
  window_seconds integer default 60
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  request_time timestamptz := statement_timestamp();
  current_attempt_count integer;
begin
  if source_fingerprint is null
    or source_fingerprint !~ '^[0-9a-f]{64}$'
    or maximum_attempts < 1
    or maximum_attempts > 100
    or window_seconds < 1
    or window_seconds > 3600 then
    return false;
  end if;

  insert into private.check_in_rate_limits (
    fingerprint,
    window_started_at,
    attempt_count
  ) values (
    source_fingerprint,
    request_time,
    1
  )
  on conflict (fingerprint) do update
  set window_started_at = case
        when private.check_in_rate_limits.window_started_at
          <= request_time - make_interval(secs => window_seconds)
          then request_time
        else private.check_in_rate_limits.window_started_at
      end,
      attempt_count = case
        when private.check_in_rate_limits.window_started_at
          <= request_time - make_interval(secs => window_seconds)
          then 1
        else private.check_in_rate_limits.attempt_count + 1
      end
  returning attempt_count into current_attempt_count;

  return current_attempt_count <= maximum_attempts;
end;
$$;

revoke execute on function public.consume_check_in_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_check_in_rate_limit(text, integer, integer)
  to service_role;

comment on function public.consume_check_in_rate_limit(text, integer, integer) is
  'Atomically enforces anonymous check-in request limits using a non-reversible application fingerprint.';

-- Rollback: first disable the public check-in route, then revoke service_role
-- execute and drop this function and private table in a reviewed forward
-- migration. Attendance rows are unaffected.
