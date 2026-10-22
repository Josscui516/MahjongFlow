-- Safe aggregate for General and authorised users; no participant projection.
create function public.get_event_dinner_eligibility_total(target_event_id uuid)
returns integer language plpgsql stable security definer set search_path='' as $$
begin
  if not (select private.is_backend_user()) then
    raise exception 'resource unavailable' using errcode='42501';
  end if;
  if not exists(select 1 from public.events where id=target_event_id) then return null; end if;
  return (select count(*)::integer
    from public.event_dinner_issuance i
    join public.attendance_records a on a.event_id=i.event_id and a.participant_id=i.participant_id
    where i.event_id=target_event_id and i.issued_at is not null and a.attendance_status='confirmed');
end;
$$;
revoke all on function public.get_event_dinner_eligibility_total(uuid) from public,anon;
grant execute on function public.get_event_dinner_eligibility_total(uuid) to authenticated;
comment on function public.get_event_dinner_eligibility_total(uuid) is 'Backend-only count of marked confirmed attendees. No identities or direct table privileges.';
notify pgrst,'reload schema';
