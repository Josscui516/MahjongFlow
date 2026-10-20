-- QR management accepts active account administrators or authorised staff.

create or replace function public.get_event_check_in_token_status(
  target_event_id uuid,
  actor_id uuid
)
returns table (
  active boolean,
  created_at timestamptz,
  revoked_at timestamptz,
  check_in_opens_at timestamptz,
  check_in_closes_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = actor_id
      and is_active
      and (committee_role = 'authorised'::public.committee_role or can_manage_accounts)
  ) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  return query
  select t.id is not null and t.revoked_at is null, t.created_at, t.revoked_at,
    e.check_in_opens_at, e.check_in_closes_at
  from public.events e
  left join lateral (
    select tokens.id, tokens.created_at, tokens.revoked_at
    from public.event_check_in_tokens tokens
    where tokens.event_id = e.id
    order by tokens.created_at desc
    limit 1
  ) t on true
  where e.id = target_event_id;
end;
$$;

create or replace function public.rotate_event_check_in_token(
  target_event_id uuid,
  actor_id uuid
)
returns table (token text, created_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_token text;
  generated_at timestamptz := statement_timestamp();
  event_state public.event_status;
  window_opens timestamptz;
  window_closes timestamptz;
begin
  if not exists (
    select 1 from public.profiles
    where id = actor_id
      and is_active
      and (committee_role = 'authorised'::public.committee_role or can_manage_accounts)
  ) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  select status, check_in_opens_at, check_in_closes_at
  into event_state, window_opens, window_closes
  from public.events where id = target_event_id for update;
  if not found then raise exception 'event unavailable' using errcode = 'P0002'; end if;
  if event_state <> 'scheduled'::public.event_status then
    raise exception 'event must be scheduled' using errcode = 'PQR01';
  end if;
  if window_opens is null or window_closes is null then
    raise exception 'registration window required' using errcode = 'PQR02';
  end if;

  generated_token := encode(extensions.gen_random_bytes(32), 'hex');
  update public.event_check_in_tokens
  set revoked_at = generated_at
  where event_id = target_event_id and revoked_at is null;

  insert into public.event_check_in_tokens (event_id, token_digest, created_by, created_at)
  values (
    target_event_id,
    encode(extensions.digest(generated_token, 'sha256'), 'hex'),
    actor_id,
    generated_at
  );

  return query select generated_token, generated_at;
end;
$$;

create or replace function public.configure_event_check_in_window(
  target_event_id uuid,
  actor_id uuid,
  opens_at timestamptz,
  closes_at timestamptz
)
returns table (
  check_in_opens_at timestamptz,
  check_in_closes_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare event_state public.event_status;
begin
  if not exists (
    select 1 from public.profiles
    where id = actor_id
      and is_active
      and (committee_role = 'authorised'::public.committee_role or can_manage_accounts)
  ) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  if opens_at is null or closes_at is null or opens_at >= closes_at then
    raise exception 'invalid check-in window' using errcode = '22023';
  end if;

  select status into event_state from public.events where id = target_event_id for update;
  if not found then raise exception 'event unavailable' using errcode = 'P0002'; end if;
  if event_state <> 'scheduled'::public.event_status then
    raise exception 'event must be scheduled' using errcode = 'PQR01';
  end if;

  return query
  update public.events
  set check_in_opens_at = opens_at,
      check_in_closes_at = closes_at,
      updated_at = statement_timestamp()
  where id = target_event_id
    and status = 'scheduled'::public.event_status
  returning events.check_in_opens_at, events.check_in_closes_at;

  if not found then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.revoke_event_check_in_token(
  target_event_id uuid,
  actor_id uuid
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  revoked_time timestamptz := statement_timestamp();
begin
  if not exists (
    select 1 from public.profiles
    where id = actor_id
      and is_active
      and (committee_role = 'authorised'::public.committee_role or can_manage_accounts)
  ) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  perform 1 from public.events where id = target_event_id for update;
  if not found then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  update public.event_check_in_tokens
  set revoked_at = revoked_time
  where event_id = target_event_id and revoked_at is null;

  return revoked_time;
end;
$$;

revoke all on function public.get_event_check_in_token_status(uuid,uuid),
  public.rotate_event_check_in_token(uuid,uuid),
  public.configure_event_check_in_window(uuid,uuid,timestamptz,timestamptz),
  public.revoke_event_check_in_token(uuid,uuid) from public, anon, authenticated;
grant execute on function public.get_event_check_in_token_status(uuid,uuid),
  public.rotate_event_check_in_token(uuid,uuid),
  public.configure_event_check_in_window(uuid,uuid,timestamptz,timestamptz),
  public.revoke_event_check_in_token(uuid,uuid) to service_role;
notify pgrst, 'reload schema';
