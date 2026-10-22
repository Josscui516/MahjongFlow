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
    join public.dinner_eligibility_roster d on d.email=lower(btrim(person.email)) and d.is_active
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
    -- Lock entitlement and participation facts until the serving write commits.
    perform 1 from public.dinner_eligibility_roster d
    join public.participants p on lower(btrim(p.email))=d.email
    join public.registrations r on r.participant_id=p.id and r.event_id=target_event_id
    join public.attendance_records a on a.participant_id=p.id and a.event_id=target_event_id
    where p.id=target_participant_id and d.is_active and r.registration_status='registered' and a.attendance_status='confirmed'
    for share of d,p,r,a;
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

-- Members may submit known identities without gaining a directory-read capability.
create or replace function public.submit_member_list_change(target_list text,operation text,entry_email text,
  entry_name text default null,target_event_id uuid default null,entry_student_id text default null)
returns void language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  normalized_email text:=lower(btrim(entry_email));
  normalized_name text:=regexp_replace(btrim(entry_name),'[[:space:]]+',' ','g');
  normalized_student text:=nullif(btrim(entry_student_id),'');
  person uuid;
  stored_name text;
  stored_student text;
  student_required boolean;
begin
  if not (select private.is_backend_user()) then raise exception 'resource unavailable' using errcode='42501'; end if;
  if target_list='registration' and not (select private.is_authorised()) then
    raise exception 'resource unavailable' using errcode='42501';
  end if;
  if target_list not in ('dinner','registration') or target_list is null
    or operation not in ('add','remove') or operation is null or normalized_email is null
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    or (operation='add' and (normalized_name is null or char_length(normalized_name) not between 1 and 120
      or normalized_name ~ '[[:cntrl:]]'))
    or (normalized_student is not null and (char_length(normalized_student)>32 or normalized_student ~ '[[:cntrl:]]'))
  then raise exception 'invalid input' using errcode='22023'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_email,61004));
  if target_list='dinner' then
    if operation='add' then
      insert into public.dinner_eligibility_roster(full_name,email,recorded_by)
      values(normalized_name,normalized_email,actor)
      on conflict(email) do update set is_active=true;
    else
      update public.dinner_eligibility_roster set is_active=false where email=normalized_email;
    end if;
    return;
  end if;
  select e.requires_student_id into student_required from public.events e where id=target_event_id for share;
  if not found then raise exception 'event unavailable' using errcode='P0002'; end if;
  if operation='add' and student_required and normalized_student is null then
    raise exception 'student ID required' using errcode='22023';
  end if;
  select p.id,p.full_name,p.student_id into person,stored_name,stored_student
    from public.participants p where p.email=normalized_email for update;
  if operation='remove' then
    update public.registrations set registration_status='cancelled',recorded_by=actor
      where event_id=target_event_id and participant_id=person;
    return;
  end if;
  if person is null then
    insert into public.participants(full_name,email,student_id)
      values(normalized_name,normalized_email,normalized_student) returning id into person;
  elsif stored_name<>normalized_name or (student_required and stored_student is distinct from normalized_student) then
    -- Return the same acknowledgement; never disclose or overwrite another identity.
    return;
  end if;
  insert into public.registrations(event_id,participant_id,recorded_by,privacy_notice_acknowledged_at)
    values(target_event_id,person,actor,statement_timestamp())
    on conflict(event_id,participant_id) do update set registration_status='registered',recorded_by=actor;
end;
$$;
revoke all on function public.submit_member_list_change(text,text,text,text,uuid,text) from public,anon;
grant execute on function public.submit_member_list_change(text,text,text,text,uuid,text) to authenticated;

notify pgrst,'reload schema';
