begin;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new) values
('a2000000-0000-4000-8000-000000000001','authenticated','authenticated','dinner-match-admin@example.test','','','',''),
('a2000000-0000-4000-8000-000000000002','authenticated','authenticated','dinner-match-committee@example.test','','','','');
insert into public.profiles(id,display_name,committee_role,can_manage_accounts) values
('a2000000-0000-4000-8000-000000000001','Fictional dinner administrator','authorised',true),
('a2000000-0000-4000-8000-000000000002','Fictional dinner committee','committee',false);
insert into public.events(id,name,event_type,starts_at,location,description,created_by) values
('a2100000-0000-4000-8000-000000000001','Fictional dinner matching','weekly_session',now(),'Test room','Fixture','a2000000-0000-4000-8000-000000000001'),
('a2100000-0000-4000-8000-000000000002','Fictional other event','weekly_session',now(),'Test room','Fixture','a2000000-0000-4000-8000-000000000001');
insert into public.participants(id,full_name,email)
select ('a2200000-0000-4000-8000-00000000000'||i)::uuid, 'Fictional attendee '||i, 'dinner-match-'||i||'@example.test' from generate_series(1,7) i;
insert into public.dinner_roster(event_id,full_name,email,recorded_by)
select 'a2100000-0000-4000-8000-000000000001','Internal name '||i,'dinner-match-'||i||'@example.test','a2000000-0000-4000-8000-000000000001'
from generate_series(1,7) i where i <> 3;
insert into public.registrations(event_id,participant_id,registration_status,recorded_by)
select case when i=6 then 'a2100000-0000-4000-8000-000000000002' else 'a2100000-0000-4000-8000-000000000001' end::uuid,
('a2200000-0000-4000-8000-00000000000'||i)::uuid,
case when i=5 then 'cancelled' else 'registered' end::public.registration_status,'a2000000-0000-4000-8000-000000000001'
from generate_series(1,6) i;
insert into public.attendance_records(event_id,participant_id,check_in_method,attendance_status,recorded_by)
select case when i=6 then 'a2100000-0000-4000-8000-000000000002' else 'a2100000-0000-4000-8000-000000000001' end::uuid,
('a2200000-0000-4000-8000-00000000000'||i)::uuid,'manual',
case when i=4 then 'voided' else 'confirmed' end::public.attendance_status,'a2000000-0000-4000-8000-000000000001'
from generate_series(1,7) i where i <> 2;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000001',true);
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),1,'only registered, confirmed and roster-matched attendees appear once');
select is((select participant_id::text from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),'a2200000-0000-4000-8000-000000000001','actual participant ID is returned, not roster entry ID');
select is((select full_name from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),'Fictional attendee 1','matching is by email, not by the internal display name');
select is((select count(*)::int from public.dinner_roster where event_id='a2100000-0000-4000-8000-000000000001'),6,'administrator retains all preloaded internal entries');
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000002')),0,'another event check-in does not match this event roster');
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000099')),0,'missing event returns no participant identities');

insert into public.attendance_records(event_id,participant_id)
values('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002');
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),2,'a later confirmed check-in appears without changing the roster');
update public.attendance_records set attendance_status='voided' where participant_id='a2200000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),1,'voiding attendance removes the matched attendee');
update public.dinner_roster set is_active=false where email='dinner-match-2@example.test';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),0,'removing roster membership removes the attendee');
update public.dinner_roster set is_active=true where email='dinner-match-2@example.test';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),1,'restoring membership recalculates from current facts');
update public.registrations set registration_status='cancelled' where participant_id='a2200000-0000-4000-8000-000000000002';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),0,'cancelled registration is excluded even with attendance and roster membership');
select is((select count(*)::int from public.dinner_roster where event_id='a2100000-0000-4000-8000-000000000001'),6,'attendance and registration corrections do not mutate the internal roster');

select set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'ordinary committee cannot read matched identities');
reset role;
update public.profiles set is_active=false where id='a2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'inactive authorised administrator cannot read matched identities');
reset role;
set local role anon;
select throws_ok($$select * from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous callers cannot execute the matching RPC');
reset role;
select * from finish();
rollback;
