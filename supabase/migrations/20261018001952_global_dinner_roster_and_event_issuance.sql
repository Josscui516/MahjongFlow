-- Standing dinner entitlement is global. Serving is recorded separately for each event.
create table public.dinner_eligibility_roster (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (full_name=btrim(full_name) and char_length(full_name) between 1 and 120),
  email text not null unique check (email=lower(btrim(email)) and char_length(email) between 3 and 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  is_active boolean not null default true,
  recorded_by uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
alter table public.dinner_eligibility_roster enable row level security;
revoke all on public.dinner_eligibility_roster from public,anon,authenticated;
grant select on public.dinner_eligibility_roster to authenticated;
grant insert(full_name,email),update(full_name,is_active) on public.dinner_eligibility_roster to authenticated;
grant all on public.dinner_eligibility_roster to service_role;
create policy dinner_eligibility_read on public.dinner_eligibility_roster for select to authenticated
  using ((select private.is_authorised()));
create policy dinner_eligibility_insert on public.dinner_eligibility_roster for insert to authenticated
  with check ((select private.is_authorised()) and (select private.is_account_admin()) and recorded_by=(select auth.uid()));
create policy dinner_eligibility_update on public.dinner_eligibility_roster for update to authenticated
  using ((select private.is_authorised()) and (select private.is_account_admin()))
  with check ((select private.is_authorised()) and (select private.is_account_admin()));

-- Preserve active existing entitlements once, deduplicated by normalized email.
insert into public.dinner_eligibility_roster(full_name,email,recorded_by,created_at)
select distinct on (email) full_name,email,recorded_by,created_at
from public.dinner_roster where is_active order by email,created_at desc,id;
revoke insert,update on public.dinner_roster from authenticated;
revoke insert(event_id,full_name,email),update(full_name,is_active) on public.dinner_roster from authenticated;
comment on table public.dinner_roster is 'Legacy per-event roster retained for history; active entries migrated once to the global dinner eligibility roster. No longer writable by app sessions.';

create table public.event_dinner_issuance (
  event_id uuid not null references public.events(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  issued_at timestamptz,
  issued_by uuid references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now(),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  primary key(event_id,participant_id),
  check ((issued_at is null) = (issued_by is null))
);
alter table public.event_dinner_issuance enable row level security;
revoke all on public.event_dinner_issuance from public,anon,authenticated;
grant select on public.event_dinner_issuance to authenticated;
grant all on public.event_dinner_issuance to service_role;
create policy event_dinner_issuance_read on public.event_dinner_issuance for select to authenticated
  using ((select private.is_authorised()));

create or replace function public.list_matched_dinner_attendees(target_event_id uuid)
returns table(event_id uuid,participant_id uuid,full_name text,email text)
language plpgsql stable security invoker set search_path='' as $$
begin
  if not (select private.is_authorised()) then raise exception 'resource unavailable' using errcode='42501'; end if;
  return query
  select r.event_id,p.id,p.full_name,p.email from public.registrations r
  join public.participants p on p.id=r.participant_id
  join public.attendance_records a on a.event_id=r.event_id and a.participant_id=p.id
  join public.dinner_eligibility_roster d on d.email=lower(btrim(p.email)) and d.is_active
  where r.event_id=target_event_id and r.registration_status='registered' and a.attendance_status='confirmed';
end;
$$;

create function public.list_event_dinner_service(target_event_id uuid)
returns table(event_id uuid,participant_id uuid,full_name text,email text,eligible boolean,issued_at timestamptz)
language plpgsql stable security invoker set search_path='' as $$
begin
  if not (select private.is_authorised()) then raise exception 'resource unavailable' using errcode='42501'; end if;
  return query
  select target_event_id,p.id,p.full_name,p.email,m.participant_id is not null,i.issued_at
  from public.participants p
  left join public.list_matched_dinner_attendees(target_event_id) m on m.participant_id=p.id
  left join public.event_dinner_issuance i on i.participant_id=p.id and i.event_id=target_event_id
  where m.participant_id is not null or i.issued_at is not null;
end;
$$;
revoke all on function public.list_event_dinner_service(uuid) from public,anon;
grant execute on function public.list_event_dinner_service(uuid) to authenticated;

create function public.set_event_dinner_issued(target_event_id uuid,target_participant_id uuid,
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
revoke all on function public.set_event_dinner_issued(uuid,uuid,boolean,boolean) from public,anon;
grant execute on function public.set_event_dinner_issued(uuid,uuid,boolean,boolean) to authenticated;
comment on table public.dinner_eligibility_roster is 'Standing dinner eligibility shared by all events; serving never consumes membership.';
comment on table public.event_dinner_issuance is 'One current dinner serving state per participant and event; only the authorised atomic RPC may change it.';
notify pgrst,'reload schema';
