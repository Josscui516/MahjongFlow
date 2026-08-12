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
grant select, insert, update on table public.participants to authenticated;
grant select, insert, update on table public.registrations to authenticated;
grant select, insert, update on table public.attendance_records to authenticated;

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

create or replace function private.prevent_last_meeting_attendee_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.has_other_meeting_attendee(old.meeting_id, old.profile_id) then
    raise exception 'a meeting must keep at least one attendee' using errcode = '23514';
  end if;
  return old;
end;
$$;

create trigger meeting_attendees_prevent_last_delete
before delete on public.meeting_attendees
for each row execute function private.prevent_last_meeting_attendee_delete();

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
