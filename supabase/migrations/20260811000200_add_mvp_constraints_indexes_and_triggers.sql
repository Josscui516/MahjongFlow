-- Issue #39: database-owned integrity constraints, indexes, and triggers.
-- Authorisation policies and application-facing RPCs are intentionally excluded.

alter table public.profiles
  add constraint profiles_display_name_check check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 120
  );

alter table public.meetings
  add constraint meetings_title_check check (
    title = btrim(title) and char_length(title) between 1 and 200
  ),
  add constraint meetings_summary_check check (
    summary = btrim(summary) and char_length(summary) between 1 and 10000
  );

alter table public.discussion_points
  add constraint discussion_points_content_check check (
    content = btrim(content) and char_length(content) between 1 and 5000
  ),
  add constraint discussion_points_position_check check (position >= 0),
  add constraint discussion_points_meeting_position_key unique (meeting_id, position);

alter table public.meeting_decisions
  add constraint meeting_decisions_content_check check (
    content = btrim(content) and char_length(content) between 1 and 5000
  ),
  add constraint meeting_decisions_position_check check (position >= 0),
  add constraint meeting_decisions_meeting_position_key unique (meeting_id, position);

alter table public.tasks
  add constraint tasks_title_check check (
    title = btrim(title) and char_length(title) between 1 and 200
  ),
  add constraint tasks_description_check check (
    description = btrim(description) and char_length(description) between 1 and 10000
  ),
  add constraint tasks_source_shape_check check (
    (
      source_meeting_id is null
      and source_decision_id is null
      and source_discussion_point_id is null
    )
    or (
      source_meeting_id is not null
      and num_nonnulls(source_decision_id, source_discussion_point_id) = 1
    )
  );

alter table public.events
  add constraint events_name_check check (
    name = btrim(name) and char_length(name) between 1 and 200
  ),
  add constraint events_location_check check (
    location = btrim(location) and char_length(location) between 1 and 300
  ),
  add constraint events_description_check check (
    description = btrim(description) and char_length(description) between 1 and 10000
  ),
  add constraint events_check_in_window_check check (
    (check_in_opens_at is null and check_in_closes_at is null)
    or (
      check_in_opens_at is not null
      and check_in_closes_at is not null
      and check_in_opens_at < check_in_closes_at
    )
  );

alter table public.event_check_in_tokens
  add constraint event_check_in_tokens_digest_check check (
    token_digest = lower(token_digest)
    and token_digest ~ '^[0-9a-f]{64}$'
  ),
  add constraint event_check_in_tokens_token_digest_key unique (token_digest),
  add constraint event_check_in_tokens_revocation_check check (
    revoked_at is null or revoked_at >= created_at
  );

alter table public.participants
  add constraint participants_full_name_check check (
    full_name = btrim(full_name)
    and char_length(full_name) between 1 and 120
  ),
  add constraint participants_email_check check (
    email = lower(btrim(email))
    and char_length(email) between 3 and 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ),
  add constraint participants_student_id_check check (
    student_id is null
    or (student_id = btrim(student_id) and char_length(student_id) between 1 and 32)
  ),
  add constraint participants_email_key unique (email);

alter table public.registrations
  add constraint registrations_event_participant_key unique (event_id, participant_id),
  add constraint registrations_privacy_acknowledgement_check check (
    privacy_notice_acknowledged_at is null
    or privacy_notice_acknowledged_at >= registered_at
  );

alter table public.attendance_records
  add constraint attendance_records_event_participant_key unique (event_id, participant_id),
  add constraint attendance_records_manual_recorder_check check (
    check_in_method <> 'manual' or recorded_by is not null
  ),
  add constraint attendance_records_voided_recorder_check check (
    attendance_status <> 'voided' or recorded_by is not null
  );

create unique index event_check_in_tokens_one_active_per_event_idx
  on public.event_check_in_tokens (event_id)
  where revoked_at is null;
create unique index participants_student_id_key
  on public.participants (student_id)
  where student_id is not null;
create unique index tasks_source_decision_key
  on public.tasks (source_decision_id)
  where source_decision_id is not null;
create unique index tasks_source_discussion_point_key
  on public.tasks (source_discussion_point_id)
  where source_discussion_point_id is not null;

create index meetings_created_by_idx on public.meetings (created_by);
create index meetings_starts_at_idx on public.meetings (starts_at);
create index meeting_attendees_profile_id_idx on public.meeting_attendees (profile_id);
create index discussion_points_meeting_id_idx on public.discussion_points (meeting_id);
create index meeting_decisions_meeting_id_idx on public.meeting_decisions (meeting_id);
create index tasks_assignee_status_due_date_idx on public.tasks (assignee_id, status, due_date);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_source_meeting_id_idx on public.tasks (source_meeting_id);
create index tasks_event_id_idx on public.tasks (event_id);
create index events_status_starts_at_idx on public.events (status, starts_at);
create index events_created_by_idx on public.events (created_by);
create index event_check_in_tokens_created_by_idx on public.event_check_in_tokens (created_by);
create index registrations_participant_id_idx on public.registrations (participant_id);
create index registrations_event_status_idx on public.registrations (event_id, registration_status);
create index registrations_recorded_by_idx on public.registrations (recorded_by);
create index attendance_records_participant_id_idx on public.attendance_records (participant_id);
create index attendance_records_event_status_idx on public.attendance_records (event_id, attendance_status);
create index attendance_records_recorded_by_idx on public.attendance_records (recorded_by)
  where recorded_by is not null;

create or replace function private.maintain_audit_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.created_at is distinct from old.created_at then
    raise exception 'created_at is immutable' using errcode = '23514';
  end if;

  if (to_jsonb(new) - 'updated_at') is distinct from (to_jsonb(old) - 'updated_at') then
    new.updated_at := statement_timestamp();
  else
    new.updated_at := old.updated_at;
  end if;

  return new;
end;
$$;

create trigger profiles_maintain_audit_timestamps
before update on public.profiles
for each row execute function private.maintain_audit_timestamps();
create trigger meetings_maintain_audit_timestamps
before update on public.meetings
for each row execute function private.maintain_audit_timestamps();
create trigger discussion_points_maintain_audit_timestamps
before update on public.discussion_points
for each row execute function private.maintain_audit_timestamps();
create trigger meeting_decisions_maintain_audit_timestamps
before update on public.meeting_decisions
for each row execute function private.maintain_audit_timestamps();
create trigger tasks_maintain_audit_timestamps
before update on public.tasks
for each row execute function private.maintain_audit_timestamps();
create trigger events_maintain_audit_timestamps
before update on public.events
for each row execute function private.maintain_audit_timestamps();
create trigger participants_maintain_audit_timestamps
before update on public.participants
for each row execute function private.maintain_audit_timestamps();
create trigger registrations_maintain_audit_timestamps
before update on public.registrations
for each row execute function private.maintain_audit_timestamps();
create trigger attendance_records_maintain_audit_timestamps
before update on public.attendance_records
for each row execute function private.maintain_audit_timestamps();

create or replace function private.validate_task_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_source_meeting_id uuid;
  current_source_decision_id uuid;
  current_source_discussion_point_id uuid;
  source_parent_meeting_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(39, 6);

  select source_meeting_id, source_decision_id, source_discussion_point_id
  into current_source_meeting_id, current_source_decision_id,
    current_source_discussion_point_id
  from public.tasks
  where id = new.id;

  if not found then
    return new;
  end if;

  if current_source_decision_id is not null then
    select meeting_id into source_parent_meeting_id
    from public.meeting_decisions
    where id = current_source_decision_id;
  elsif current_source_discussion_point_id is not null then
    select meeting_id into source_parent_meeting_id
    from public.discussion_points
    where id = current_source_discussion_point_id;
  else
    return new;
  end if;

  if source_parent_meeting_id is distinct from current_source_meeting_id then
    raise exception 'task source must belong to source_meeting_id' using errcode = '23514';
  end if;
  return new;
end;
$$;

create constraint trigger tasks_validate_source
after insert or update of source_meeting_id, source_decision_id, source_discussion_point_id
on public.tasks deferrable initially immediate
for each row execute function private.validate_task_source();

create or replace function private.validate_task_source_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_meeting_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(39, 6);

  if tg_table_name = 'meeting_decisions' then
    select meeting_id into current_meeting_id
    from public.meeting_decisions
    where id = new.id;

    if found and exists (
      select 1
      from public.tasks
      where source_decision_id = new.id
        and source_meeting_id is distinct from current_meeting_id
    ) then
      raise exception 'referenced decision must remain in the task source meeting'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'discussion_points' then
    select meeting_id into current_meeting_id
    from public.discussion_points
    where id = new.id;

    if found and exists (
      select 1
      from public.tasks
      where source_discussion_point_id = new.id
        and source_meeting_id is distinct from current_meeting_id
    ) then
      raise exception 'referenced discussion point must remain in the task source meeting'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger meeting_decisions_validate_task_sources
after update of meeting_id on public.meeting_decisions
deferrable initially immediate
for each row execute function private.validate_task_source_parent();

create constraint trigger discussion_points_validate_task_sources
after update of meeting_id on public.discussion_points
deferrable initially immediate
for each row execute function private.validate_task_source_parent();

create or replace function private.validate_registration_student_id()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_event_id uuid;
  current_participant_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(39, 5);

  select event_id, participant_id
  into current_event_id, current_participant_id
  from public.registrations
  where id = new.id;

  if not found then
    return new;
  end if;

  if exists (
    select 1
    from public.events e
    join public.participants p on p.id = current_participant_id
    where e.id = current_event_id
      and e.requires_student_id
      and p.student_id is null
  ) then
    raise exception 'student_id is required for this event' using errcode = '23514';
  end if;
  return new;
end;
$$;

create constraint trigger registrations_validate_student_id
after insert or update of event_id, participant_id
on public.registrations deferrable initially immediate
for each row execute function private.validate_registration_student_id();

create or replace function private.validate_registration_student_id_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_requires_student_id boolean;
  current_student_id text;
begin
  perform pg_catalog.pg_advisory_xact_lock(39, 5);

  if tg_table_name = 'events' then
    select requires_student_id into current_requires_student_id
    from public.events
    where id = new.id;

    if found and current_requires_student_id and exists (
      select 1
      from public.registrations r
      join public.participants p on p.id = r.participant_id
      where r.event_id = new.id
        and p.student_id is null
    ) then
      raise exception 'registered participants require a student_id for this event'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'participants' then
    select student_id into current_student_id
    from public.participants
    where id = new.id;

    if found and current_student_id is null and exists (
      select 1
      from public.registrations r
      join public.events e on e.id = r.event_id
      where r.participant_id = new.id
        and e.requires_student_id
    ) then
      raise exception 'student_id is required by an existing registration'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create constraint trigger events_validate_registration_student_ids
after update of requires_student_id on public.events
deferrable initially immediate
for each row execute function private.validate_registration_student_id_parent();

create constraint trigger participants_validate_registration_student_ids
after update of student_id on public.participants
deferrable initially immediate
for each row execute function private.validate_registration_student_id_parent();

revoke execute on function private.validate_task_source()
  from public, anon, authenticated;
revoke execute on function private.validate_task_source_parent()
  from public, anon, authenticated;
revoke execute on function private.validate_registration_student_id()
  from public, anon, authenticated;
revoke execute on function private.validate_registration_student_id_parent()
  from public, anon, authenticated;

create or replace function private.validate_qr_attendance_registration()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.check_in_method = 'qr'
    and not exists (
      select 1
      from public.registrations r
      where r.event_id = new.event_id
        and r.participant_id = new.participant_id
        and r.registration_status = 'registered'
    ) then
    raise exception 'QR attendance requires an active registration' using errcode = '23514';
  end if;
  return new;
end;
$$;

create constraint trigger attendance_records_validate_qr_registration
after insert or update of event_id, participant_id, check_in_method
on public.attendance_records deferrable initially immediate
for each row execute function private.validate_qr_attendance_registration();
