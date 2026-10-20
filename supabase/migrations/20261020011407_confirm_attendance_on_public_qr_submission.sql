-- Public QR submission is participant-operated registration and confirmed check-in in one transaction.
-- Keep the registration-only primitive for staff workflows; never restore a staff-voided attendance.
create function public.submit_event_self_check_in(
  registration_token text,participant_name text,participant_email text,
  privacy_accepted boolean,participant_student_id text default null
) returns text language plpgsql security definer set search_path='' as $$
declare
  registration_result text;
  target_event uuid;
  person uuid;
  current_attendance public.attendance_status;
begin
  -- This validates/locks the token, event window, identity, consent and registration.
  -- Its identity advisory lock also serializes duplicate public submissions.
  registration_result := public.submit_event_registration(
    registration_token,participant_name,participant_email,privacy_accepted,participant_student_id);
  if registration_result not in ('success','already_processed') then return registration_result; end if;
  select t.event_id into target_event from public.event_check_in_tokens t
    where t.token_digest=encode(extensions.digest(registration_token,'sha256'),'hex');
  select p.id into person from public.participants p where p.email=lower(btrim(participant_email));
  select a.attendance_status into current_attendance from public.attendance_records a
    where a.event_id=target_event and a.participant_id=person for update;
  if found then
    if current_attendance='confirmed' then return 'already_processed'; end if;
    -- Raising inside this exception block also rolls back any new registration above.
    raise exception 'staff correction required' using errcode='PQV01';
  end if;
  insert into public.attendance_records(event_id,participant_id,check_in_method,attendance_status,recorded_by)
    values(target_event,person,'qr','confirmed',null);
  return 'success';
exception when sqlstate 'PQV01' then
  return 'unable_to_process';
end;
$$;
revoke all on function public.submit_event_self_check_in(text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function public.submit_event_self_check_in(text,text,text,boolean,text) to service_role;
comment on function public.submit_event_self_check_in(text,text,text,boolean,text) is
  'Participant QR registration and confirmed attendance, atomic and idempotent. Existing staff cancellations/voids are not restored. Dinner membership is read independently.';
notify pgrst,'reload schema';
