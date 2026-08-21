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

  -- Parent deletion cascades through this table after the meeting row is gone.
  -- In that case the non-empty attendee invariant no longer applies.
  if not found then
    return old;
  end if;

  if not private.has_other_meeting_attendee(old.meeting_id, old.profile_id) then
    raise exception 'a meeting must keep at least one attendee' using errcode = '23514';
  end if;
  return old;
end;
$$;

create or replace function public.delete_meeting_record(target_meeting_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;

  -- Serialise against task source validation so a meeting cannot be deleted
  -- while a new traceable task is being linked to it.
  perform pg_catalog.pg_advisory_xact_lock(39, 6);

  if not exists (
    select 1 from public.meetings where id = target_meeting_id
  ) then
    return 'not_found';
  end if;

  if exists (
    select 1 from public.tasks where source_meeting_id = target_meeting_id
  ) then
    return 'linked_tasks';
  end if;

  delete from public.meetings where id = target_meeting_id;
  return 'deleted';
end;
$$;

revoke all on function public.delete_meeting_record(uuid) from public, anon;
grant execute on function public.delete_meeting_record(uuid) to authenticated;

comment on function public.delete_meeting_record(uuid) is
  'Deletes one meeting and its agenda through a backend-only boundary; linked tasks block deletion.';
