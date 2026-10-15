-- User-approved correction: public QR registration and an independent dinner roster.
-- No historical attendance is converted to dinner eligibility.
alter table public.registrations alter column recorded_by drop not null;

create table public.dinner_roster (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  full_name text not null check (full_name = btrim(full_name) and char_length(full_name) between 1 and 120),
  email text not null check (email = lower(btrim(email)) and char_length(email) between 3 and 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  is_active boolean not null default true,
  recorded_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);
alter table public.dinner_roster enable row level security;
revoke all on public.dinner_roster from public, anon, authenticated;
grant select on public.dinner_roster to authenticated;
grant insert(event_id, full_name, email), update(full_name, is_active) on public.dinner_roster to authenticated;
grant all on public.dinner_roster to service_role;
create policy dinner_roster_authorised_read on public.dinner_roster for select to authenticated
  using ((select private.is_authorised()));
create policy dinner_roster_admin_insert on public.dinner_roster for insert to authenticated
  with check ((select private.is_authorised()) and (select private.is_account_admin())
    and recorded_by = (select auth.uid()));
create policy dinner_roster_admin_update on public.dinner_roster for update to authenticated
  using ((select private.is_authorised()) and (select private.is_account_admin()))
  with check ((select private.is_authorised()) and (select private.is_account_admin()));

create function public.submit_event_registration(
  registration_token text, participant_name text, participant_email text,
  privacy_accepted boolean, participant_student_id text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare
  target_event uuid;
  required_student boolean;
  person uuid;
  stored_name text;
  stored_student text;
  normalized_email text := lower(btrim(participant_email));
  normalized_name text := btrim(participant_name);
  normalized_student text := nullif(btrim(participant_student_id), '');
  current_status public.registration_status;
  accepted_at timestamptz := statement_timestamp();
begin
  if registration_token is null or registration_token !~ '^[0-9a-f]{64}$' then return 'unavailable'; end if;
  select e.id, e.requires_student_id into target_event, required_student
  from public.event_check_in_tokens t join public.events e on e.id=t.event_id
  where t.token_digest=encode(extensions.digest(registration_token,'sha256'),'hex')
    and t.revoked_at is null and e.status='scheduled'
    and e.check_in_opens_at <= accepted_at and e.check_in_closes_at > accepted_at
  for share of e,t;
  if target_event is null then return 'unavailable'; end if;
  if privacy_accepted is distinct from true or normalized_name is null
    or char_length(normalized_name) not between 1 and 120
    or normalized_email is null or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
    or (normalized_student is not null and char_length(normalized_student)>32)
    or (required_student and normalized_student is null) then return 'unable_to_process'; end if;
  -- Serialize concurrent registrations for one identity; never overwrite another identity.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized_email, 61004));
  select id,full_name,student_id into person,stored_name,stored_student
    from public.participants where email=normalized_email for update;
  if person is null then
    insert into public.participants(full_name,email,student_id)
      values(normalized_name,normalized_email,normalized_student) returning id into person;
  elsif stored_name <> normalized_name or (required_student and stored_student is distinct from normalized_student) then
    return 'unable_to_process';
  end if;
  select registration_status into current_status from public.registrations
    where event_id=target_event and participant_id=person for update;
  if found then
    -- Do not let the public endpoint restore a staff-cancelled registration.
    return case when current_status='registered' then 'already_processed' else 'unable_to_process' end;
  end if;
  insert into public.registrations(event_id,participant_id,recorded_by,registered_at,privacy_notice_acknowledged_at)
    values(target_event,person,null,accepted_at,accepted_at);
  -- Registration does not create attendance or change the dinner roster.
  return 'success';
end;
$$;
revoke all on function public.submit_event_registration(text,text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.submit_event_registration(text,text,text,boolean,text) to service_role;

comment on table public.dinner_roster is 'Administrator-preloaded dinner entitlement; independent of registration and attendance.';
