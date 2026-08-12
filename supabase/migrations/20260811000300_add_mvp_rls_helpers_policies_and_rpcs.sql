create schema if not exists private;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_backend_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and committee_role in ('committee'::public.committee_role, 'authorised'::public.committee_role)
  );
$$;

create or replace function private.is_authorised()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and committee_role = 'authorised'::public.committee_role
  );
$$;

create or replace function private.has_other_meeting_attendee(
  target_meeting_id uuid,
  excluded_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.meeting_attendees
    where meeting_id = target_meeting_id
      and profile_id <> excluded_profile_id
  );
$$;

revoke execute on function private.is_backend_user() from public, anon;
revoke execute on function private.is_authorised() from public, anon;
revoke execute on function private.has_other_meeting_attendee(uuid, uuid) from public, anon;
grant execute on function private.is_backend_user() to authenticated;
grant execute on function private.is_authorised() to authenticated;
grant execute on function private.has_other_meeting_attendee(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.meetings enable row level security;
alter table public.meeting_attendees enable row level security;
alter table public.discussion_points enable row level security;
alter table public.meeting_decisions enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;
alter table public.event_check_in_tokens enable row level security;
alter table public.participants enable row level security;
alter table public.registrations enable row level security;
alter table public.attendance_records enable row level security;

revoke all on table public.profiles, public.meetings, public.meeting_attendees,
  public.discussion_points, public.meeting_decisions, public.tasks, public.events,
  public.event_check_in_tokens, public.participants, public.registrations,
  public.attendance_records from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select, insert, update on table public.meetings to authenticated;
grant select, insert, delete on table public.meeting_attendees to authenticated;
grant select, insert, update, delete on table public.discussion_points to authenticated;
grant select, insert, update, delete on table public.meeting_decisions to authenticated;
grant select, insert, update on table public.tasks to authenticated;
grant select, insert, update on table public.events to authenticated;
grant select on table public.participants, public.registrations,
  public.attendance_records to authenticated;
grant insert (full_name, email, student_id)
  on table public.participants to authenticated;
grant update (full_name, email, student_id)
  on table public.participants to authenticated;
grant insert (event_id, participant_id, privacy_notice_acknowledged_at)
  on table public.registrations to authenticated;
grant update (registration_status, privacy_notice_acknowledged_at)
  on table public.registrations to authenticated;
grant insert (event_id, participant_id)
  on table public.attendance_records to authenticated;
grant update (attendance_status)
  on table public.attendance_records to authenticated;

create policy profiles_backend_select on public.profiles
  for select to authenticated
  using ((select private.is_backend_user()));

create policy meetings_backend_select on public.meetings
  for select to authenticated
  using ((select private.is_backend_user()));
create policy meetings_backend_insert on public.meetings
  for insert to authenticated
  with check (
    (select private.is_backend_user())
    and created_by = (select auth.uid())
  );
create policy meetings_backend_update on public.meetings
  for update to authenticated
  using ((select private.is_backend_user()))
  with check ((select private.is_backend_user()));

create policy meeting_attendees_backend_select on public.meeting_attendees
  for select to authenticated
  using ((select private.is_backend_user()));
create policy meeting_attendees_backend_insert on public.meeting_attendees
  for insert to authenticated
  with check ((select private.is_backend_user()));
create policy meeting_attendees_backend_delete on public.meeting_attendees
  for delete to authenticated
  using (
    (select private.is_backend_user())
    and private.has_other_meeting_attendee(meeting_id, profile_id)
  );

create policy discussion_points_backend_select on public.discussion_points
  for select to authenticated
  using ((select private.is_backend_user()));
create policy discussion_points_backend_insert on public.discussion_points
  for insert to authenticated
  with check ((select private.is_backend_user()));
create policy discussion_points_backend_update on public.discussion_points
  for update to authenticated
  using ((select private.is_backend_user()))
  with check ((select private.is_backend_user()));
create policy discussion_points_backend_delete on public.discussion_points
  for delete to authenticated
  using ((select private.is_backend_user()));

create policy meeting_decisions_backend_select on public.meeting_decisions
  for select to authenticated
  using ((select private.is_backend_user()));
create policy meeting_decisions_backend_insert on public.meeting_decisions
  for insert to authenticated
  with check ((select private.is_backend_user()));
create policy meeting_decisions_backend_update on public.meeting_decisions
  for update to authenticated
  using ((select private.is_backend_user()))
  with check ((select private.is_backend_user()));
create policy meeting_decisions_backend_delete on public.meeting_decisions
  for delete to authenticated
  using ((select private.is_backend_user()));

create policy tasks_backend_select on public.tasks
  for select to authenticated
  using ((select private.is_backend_user()));
create policy tasks_backend_insert on public.tasks
  for insert to authenticated
  with check (
    (select private.is_backend_user())
    and created_by = (select auth.uid())
  );
create policy tasks_backend_update on public.tasks
  for update to authenticated
  using ((select private.is_backend_user()))
  with check ((select private.is_backend_user()));

create policy events_backend_select on public.events
  for select to authenticated
  using ((select private.is_backend_user()));
create policy events_backend_insert on public.events
  for insert to authenticated
  with check (
    (select private.is_backend_user())
    and created_by = (select auth.uid())
  );
create policy events_backend_update on public.events
  for update to authenticated
  using ((select private.is_backend_user()))
  with check ((select private.is_backend_user()));

create policy participants_authorised_select on public.participants
  for select to authenticated
  using ((select private.is_authorised()));
create policy participants_authorised_insert on public.participants
  for insert to authenticated
  with check ((select private.is_authorised()));
create policy participants_authorised_update on public.participants
  for update to authenticated
  using ((select private.is_authorised()))
  with check ((select private.is_authorised()));

create policy registrations_authorised_select on public.registrations
  for select to authenticated
  using ((select private.is_authorised()));
create policy registrations_authorised_insert on public.registrations
  for insert to authenticated
  with check (
    (select private.is_authorised())
    and recorded_by = (select auth.uid())
  );
create policy registrations_authorised_update on public.registrations
  for update to authenticated
  using ((select private.is_authorised()))
  with check (
    (select private.is_authorised())
    and recorded_by = (select auth.uid())
  );

create policy attendance_records_authorised_select on public.attendance_records
  for select to authenticated
  using ((select private.is_authorised()));
create policy attendance_records_authorised_insert on public.attendance_records
  for insert to authenticated
  with check (
    (select private.is_authorised())
    and recorded_by = (select auth.uid())
  );
create policy attendance_records_authorised_update on public.attendance_records
  for update to authenticated
  using ((select private.is_authorised()))
  with check (
    (select private.is_authorised())
    and recorded_by = (select auth.uid())
  );

create or replace function private.reject_created_by_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger meetings_reject_created_by_change
before update on public.meetings
for each row execute function private.reject_created_by_change();
create trigger tasks_reject_created_by_change
before update on public.tasks
for each row execute function private.reject_created_by_change();
create trigger events_reject_created_by_change
before update on public.events
for each row execute function private.reject_created_by_change();

create or replace function private.reject_task_source_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.source_meeting_id is distinct from old.source_meeting_id
    or new.source_decision_id is distinct from old.source_decision_id
    or new.source_discussion_point_id is distinct from old.source_discussion_point_id then
    raise exception 'task source fields are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger tasks_reject_source_change
before update on public.tasks
for each row execute function private.reject_task_source_change();

create or replace function private.apply_trusted_registration_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.registration_status := 'registered'::public.registration_status;
    new.registered_at := statement_timestamp();
  elsif new.id is distinct from old.id
    or new.event_id is distinct from old.event_id
    or new.participant_id is distinct from old.participant_id
    or new.registered_at is distinct from old.registered_at
    or new.created_at is distinct from old.created_at then
    raise exception 'registration identity and creation fields are immutable'
      using errcode = '42501';
  end if;

  new.recorded_by := auth.uid();
  return new;
end;
$$;

create trigger registrations_apply_trusted_fields
before insert or update on public.registrations
for each row execute function private.apply_trusted_registration_fields();

create or replace function private.apply_trusted_attendance_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'authenticated' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.checked_in_at := statement_timestamp();
    new.check_in_method := 'manual'::public.check_in_method;
    new.attendance_status := 'confirmed'::public.attendance_status;
  elsif new.id is distinct from old.id
    or new.event_id is distinct from old.event_id
    or new.participant_id is distinct from old.participant_id
    or new.checked_in_at is distinct from old.checked_in_at
    or new.check_in_method is distinct from old.check_in_method
    or new.created_at is distinct from old.created_at then
    raise exception 'attendance identity and provenance fields are immutable'
      using errcode = '42501';
  end if;

  new.recorded_by := auth.uid();
  return new;
end;
$$;

create trigger attendance_records_apply_trusted_fields
before insert or update on public.attendance_records
for each row execute function private.apply_trusted_attendance_fields();

create or replace function private.prevent_last_meeting_attendee_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.meetings
  where id = old.meeting_id
  for update;

  if not private.has_other_meeting_attendee(old.meeting_id, old.profile_id) then
    raise exception 'a meeting must keep at least one attendee' using errcode = '23514';
  end if;
  return old;
end;
$$;

create trigger meeting_attendees_prevent_last_delete
before delete on public.meeting_attendees
for each row execute function private.prevent_last_meeting_attendee_delete();

revoke execute on function private.apply_trusted_registration_fields() from public, anon, authenticated;
revoke execute on function private.apply_trusted_attendance_fields() from public, anon, authenticated;
revoke execute on function private.prevent_last_meeting_attendee_delete() from public, anon, authenticated;

create or replace function public.get_event_participation_totals(event_ids uuid[])
returns table (
  event_id uuid,
  registration_count bigint,
  attendance_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select requested.event_id,
    count(distinct r.id) filter (where r.registration_status = 'registered'::public.registration_status),
    count(distinct a.id) filter (where a.attendance_status = 'confirmed'::public.attendance_status)
  from unnest(event_ids) as requested(event_id)
  join public.events e on e.id = requested.event_id
  left join public.registrations r on r.event_id = e.id
  left join public.attendance_records a on a.event_id = e.id
  where (select private.is_backend_user())
  group by requested.event_id;
$$;

revoke execute on function public.get_event_participation_totals(uuid[]) from public, anon;
grant execute on function public.get_event_participation_totals(uuid[]) to authenticated;

comment on function public.get_event_participation_totals(uuid[]) is
  'Returns only event identifiers and safe aggregate counts to authenticated backend users.';

create or replace function public.get_check_in_context(check_in_token text)
returns table (
  result text,
  event_id uuid,
  event_name text,
  starts_at timestamptz,
  location text,
  window_status text,
  student_id_required boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  matched_event_id uuid;
  matched_event_name text;
  matched_starts_at timestamptz;
  matched_location text;
  matched_requires_student_id boolean;
begin
  if check_in_token is null
    or char_length(check_in_token) <> 64
    or check_in_token !~ '^[0-9a-f]+$' then
    return query select 'unavailable'::text, null::uuid, null::text,
      null::timestamptz, null::text, null::text, null::boolean;
    return;
  end if;

  select e.id, e.name, e.starts_at, e.location, e.requires_student_id
  into matched_event_id, matched_event_name, matched_starts_at,
    matched_location, matched_requires_student_id
  from public.event_check_in_tokens t
  join public.events e on e.id = t.event_id
  where t.token_digest = encode(extensions.digest(check_in_token, 'sha256'), 'hex')
    and t.revoked_at is null
    and e.status = 'scheduled'::public.event_status
    and e.check_in_opens_at is not null
    and e.check_in_closes_at is not null
    and statement_timestamp() >= e.check_in_opens_at
    and statement_timestamp() < e.check_in_closes_at
  limit 1;

  if matched_event_id is null then
    return query select 'unavailable'::text, null::uuid, null::text,
      null::timestamptz, null::text, null::text, null::boolean;
    return;
  end if;

  return query select 'available'::text, matched_event_id, matched_event_name,
    matched_starts_at, matched_location, 'open'::text,
    matched_requires_student_id;
end;
$$;

create or replace function public.submit_event_check_in(
  check_in_token text,
  participant_email text,
  participant_student_id text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_event_id uuid;
  matched_requires_student_id boolean;
  matched_participant_id uuid;
begin
  if check_in_token is null
    or char_length(check_in_token) <> 64
    or check_in_token !~ '^[0-9a-f]+$' then
    return 'unavailable';
  end if;

  select e.id, e.requires_student_id
  into matched_event_id, matched_requires_student_id
  from public.event_check_in_tokens t
  join public.events e on e.id = t.event_id
  where t.token_digest = encode(extensions.digest(check_in_token, 'sha256'), 'hex')
    and t.revoked_at is null
    and e.status = 'scheduled'::public.event_status
    and e.check_in_opens_at is not null
    and e.check_in_closes_at is not null
    and statement_timestamp() >= e.check_in_opens_at
    and statement_timestamp() < e.check_in_closes_at
  for update of t;

  if matched_event_id is null then
    return 'unavailable';
  end if;

  if participant_email is null
    or char_length(btrim(participant_email)) > 254
    or (
      participant_student_id is not null
      and char_length(btrim(participant_student_id)) > 32
    ) then
    return 'unable_to_process';
  end if;

  select p.id
  into matched_participant_id
  from public.participants p
  join public.registrations r
    on r.participant_id = p.id
    and r.event_id = matched_event_id
    and r.registration_status = 'registered'::public.registration_status
  where p.email = lower(btrim(participant_email))
    and (
      not matched_requires_student_id
      or (
        participant_student_id is not null
        and p.student_id = btrim(participant_student_id)
      )
    )
  limit 1;

  if matched_participant_id is null then
    return 'unable_to_process';
  end if;

  if exists (
    select 1
    from public.attendance_records
    where event_id = matched_event_id
      and participant_id = matched_participant_id
  ) then
    return 'already_processed';
  end if;

  begin
    insert into public.attendance_records (
      event_id,
      participant_id,
      checked_in_at,
      check_in_method,
      attendance_status,
      recorded_by
    ) values (
      matched_event_id,
      matched_participant_id,
      statement_timestamp(),
      'qr'::public.check_in_method,
      'confirmed'::public.attendance_status,
      null
    );
  exception
    when unique_violation then
      return 'already_processed';
  end;

  return 'success';
end;
$$;

create or replace function public.rotate_event_check_in_token(
  target_event_id uuid,
  actor_id uuid
)
returns table (
  token text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  generated_token text;
  generated_at timestamptz := statement_timestamp();
begin
  if not exists (
    select 1
    from public.profiles
    where id = actor_id
      and committee_role = 'authorised'::public.committee_role
  ) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.events
  where id = target_event_id
  for update;

  if not found then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  generated_token := encode(extensions.gen_random_bytes(32), 'hex');

  update public.event_check_in_tokens
  set revoked_at = generated_at
  where event_id = target_event_id
    and revoked_at is null;

  insert into public.event_check_in_tokens (
    event_id,
    token_digest,
    created_by,
    created_at
  ) values (
    target_event_id,
    encode(extensions.digest(generated_token, 'sha256'), 'hex'),
    actor_id,
    generated_at
  );

  return query select generated_token, generated_at;
end;
$$;

revoke execute on function public.get_check_in_context(text)
  from public, anon, authenticated;
revoke execute on function public.submit_event_check_in(text, text, text)
  from public, anon, authenticated;
revoke execute on function public.rotate_event_check_in_token(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.get_check_in_context(text) to service_role;
grant execute on function public.submit_event_check_in(text, text, text) to service_role;
grant execute on function public.rotate_event_check_in_token(uuid, uuid) to service_role;

comment on function public.get_check_in_context(text) is
  'Returns the minimum current-event context for one server-validated token.';
comment on function public.submit_event_check_in(text, text, text) is
  'Atomically performs one minimum server-only QR check-in without exposing participant data.';
comment on function public.rotate_event_check_in_token(uuid, uuid) is
  'Rotates one event token and returns the new plaintext exactly once to a trusted server.';
