-- Members may submit known identities without gaining a directory-read capability.
create function public.submit_member_list_change(target_list text,operation text,entry_email text,
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
-- Safety staff manage membership directly; no separate developer/admin gate.
alter policy dinner_eligibility_insert on public.dinner_eligibility_roster
  with check ((select private.is_authorised()) and recorded_by=(select auth.uid()));
alter policy dinner_eligibility_update on public.dinner_eligibility_roster
  using ((select private.is_authorised())) with check ((select private.is_authorised()));
notify pgrst,'reload schema';
