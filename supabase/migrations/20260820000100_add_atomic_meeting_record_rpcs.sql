-- Issue #12: atomic persistence boundary for a meeting and its attendee set.
-- Existing tables and RLS remain unchanged. These security-invoker functions
-- use the caller's JWT role and are available only to authenticated clients.

create or replace function public.create_meeting_record(
  meeting_title text,
  meeting_starts_at timestamptz,
  meeting_summary text,
  attendee_ids uuid[]
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_meeting_id uuid;
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;

  if attendee_ids is null
    or cardinality(attendee_ids) = 0
    or array_position(attendee_ids, null) is not null
    or cardinality(attendee_ids) <> (
      select count(distinct attendee_id)
      from unnest(attendee_ids) as requested(attendee_id)
    ) then
    raise exception 'at least one unique attendee is required' using errcode = '23514';
  end if;

  insert into public.meetings (title, starts_at, summary, created_by)
  values (meeting_title, meeting_starts_at, meeting_summary, auth.uid())
  returning id into created_meeting_id;

  insert into public.meeting_attendees (meeting_id, profile_id)
  select created_meeting_id, attendee_id
  from unnest(attendee_ids) as requested(attendee_id);

  return created_meeting_id;
end;
$$;

create or replace function public.update_meeting_record(
  meeting_id uuid,
  meeting_title text,
  meeting_starts_at timestamptz,
  meeting_summary text,
  attendee_ids uuid[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;

  if attendee_ids is null
    or cardinality(attendee_ids) = 0
    or array_position(attendee_ids, null) is not null
    or cardinality(attendee_ids) <> (
      select count(distinct attendee_id)
      from unnest(attendee_ids) as requested(attendee_id)
    ) then
    raise exception 'at least one unique attendee is required' using errcode = '23514';
  end if;

  update public.meetings
  set title = meeting_title,
      starts_at = meeting_starts_at,
      summary = meeting_summary
  where id = meeting_id;

  if not found then
    return false;
  end if;

  -- Add desired attendees before removing old attendees so the existing
  -- last-attendee invariant remains true throughout the transaction.
  insert into public.meeting_attendees (meeting_id, profile_id)
  select update_meeting_record.meeting_id, attendee_id
  from unnest(attendee_ids) as requested(attendee_id)
  on conflict do nothing;

  delete from public.meeting_attendees current_attendee
  where current_attendee.meeting_id = update_meeting_record.meeting_id
    and current_attendee.profile_id <> all(attendee_ids);

  return true;
end;
$$;

revoke execute on function public.create_meeting_record(text, timestamptz, text, uuid[])
  from public, anon;
revoke execute on function public.update_meeting_record(uuid, text, timestamptz, text, uuid[])
  from public, anon;
grant execute on function public.create_meeting_record(text, timestamptz, text, uuid[])
  to authenticated;
grant execute on function public.update_meeting_record(uuid, text, timestamptz, text, uuid[])
  to authenticated;

comment on function public.create_meeting_record(text, timestamptz, text, uuid[]) is
  'Atomically creates one meeting and its non-empty attendee set for a backend user.';
comment on function public.update_meeting_record(uuid, text, timestamptz, text, uuid[]) is
  'Atomically updates meeting fields and replaces its non-empty attendee set for a backend user.';
