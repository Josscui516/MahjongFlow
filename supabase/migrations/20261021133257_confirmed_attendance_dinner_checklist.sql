-- Confirmed attendance replaces shared roster membership for the event checklist.
-- Only active authorised staff may access event dinner verification and issuance.
create or replace function public.list_event_dinner_service(target_event_id uuid)
returns table(event_id uuid,participant_id uuid,full_name text,email text,eligible boolean,issued_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not (select private.is_authorised()) then raise exception 'resource unavailable' using errcode='42501'; end if;
  return query
  select target_event_id,p.id,p.full_name,p.email,m.participant_id is not null,i.issued_at
  from public.participants p
  left join (
    select r.participant_id from public.registrations r
    join public.participants person on person.id=r.participant_id
    join public.attendance_records a on a.participant_id=r.participant_id and a.event_id=r.event_id and a.attendance_status='confirmed'
    where r.event_id=target_event_id and r.registration_status='registered'
  ) m on m.participant_id=p.id
  left join public.event_dinner_issuance i on i.participant_id=p.id and i.event_id=target_event_id
  where m.participant_id is not null or i.issued_at is not null;
end;
$$;
create or replace function public.set_event_dinner_issued(target_event_id uuid,target_participant_id uuid,
  desired_issued boolean,expected_issued boolean)
returns timestamptz language plpgsql security definer set search_path='' as $$
declare
  current_time_value timestamptz;
  actor uuid := auth.uid();
begin
  if not (select private.is_authorised()) then raise exception 'resource unavailable' using errcode='42501'; end if;
  if desired_issued is null or expected_issued is null then raise exception 'invalid input' using errcode='22023'; end if;
  -- Serialize both first and subsequent writes, including simultaneous staff clicks.
  perform 1 from public.events where id=target_event_id for update;
  if not found then raise exception 'event unavailable' using errcode='P0002'; end if;
  select i.issued_at into current_time_value from public.event_dinner_issuance i
    where i.event_id=target_event_id and i.participant_id=target_participant_id for update;
  if (current_time_value is not null)=desired_issued then return current_time_value; end if;
  if (current_time_value is not null)<>expected_issued then raise exception 'refresh required' using errcode='40001'; end if;
  if desired_issued then
    -- Lock confirmed participation until the mark commits.
    perform 1 from public.participants p
    join public.registrations r on r.participant_id=p.id and r.event_id=target_event_id
    join public.attendance_records a on a.participant_id=p.id and a.event_id=target_event_id
    where p.id=target_participant_id and r.registration_status='registered' and a.attendance_status='confirmed'
    for share of p,r,a;
    if not found then raise exception 'not eligible' using errcode='PDI01'; end if;
    current_time_value := statement_timestamp();
  else
    current_time_value := null;
  end if;
  insert into public.event_dinner_issuance(event_id,participant_id,issued_at,issued_by,updated_by)
  values(target_event_id,target_participant_id,current_time_value,case when desired_issued then actor else null end,actor)
  on conflict(event_id,participant_id) do update set issued_at=excluded.issued_at,issued_by=excluded.issued_by,
    updated_by=actor,updated_at=statement_timestamp();
  return current_time_value;
end;
$$;
revoke all on function public.list_event_dinner_service(uuid),public.set_event_dinner_issued(uuid,uuid,boolean,boolean) from public,anon;
grant execute on function public.list_event_dinner_service(uuid),public.set_event_dinner_issued(uuid,uuid,boolean,boolean) to authenticated;
-- No grants or policies on roster, participants, registrations or attendance are widened.
notify pgrst,'reload schema';
