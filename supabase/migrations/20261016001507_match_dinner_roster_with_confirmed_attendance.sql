-- The internal roster is preloaded independently; eligibility requires a current check-in match.
create function public.list_matched_dinner_attendees(target_event_id uuid)
returns table (event_id uuid, participant_id uuid, full_name text, email text)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not (select private.is_authorised()) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  return query
  select r.event_id, p.id, p.full_name, p.email
  from public.registrations r
  join public.participants p on p.id = r.participant_id
  join public.attendance_records a on a.event_id = r.event_id and a.participant_id = p.id
  join public.dinner_roster d on d.event_id = r.event_id and d.email = lower(btrim(p.email))
  where r.event_id = target_event_id
    and r.registration_status = 'registered'::public.registration_status
    and a.attendance_status = 'confirmed'::public.attendance_status
    and d.is_active;
end;
$$;

revoke all on function public.list_matched_dinner_attendees(uuid) from public, anon;
grant execute on function public.list_matched_dinner_attendees(uuid) to authenticated;
comment on function public.list_matched_dinner_attendees(uuid) is
  'Authorised-only current dinner attendees: same-event registration, confirmed attendance and normalized email match to active internal roster. Invoker RLS applies.';
comment on table public.dinner_roster is
  'Administrator-preloaded internal dinner list; current dinner eligibility also requires same-event registration and confirmed attendance matching by email.';
notify pgrst, 'reload schema';
