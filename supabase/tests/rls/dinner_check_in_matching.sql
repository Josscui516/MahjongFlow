begin;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new) values
('a2000000-0000-4000-8000-000000000001','authenticated','authenticated','dinner-match-admin@example.test','','','',''),
('a2000000-0000-4000-8000-000000000002','authenticated','authenticated','dinner-match-committee@example.test','','','','');
insert into public.profiles(id,display_name,committee_role,can_manage_accounts) values
('a2000000-0000-4000-8000-000000000001','Fictional dinner administrator','authorised',false),
('a2000000-0000-4000-8000-000000000002','Fictional dinner committee','committee',false);
insert into public.events(id,name,event_type,starts_at,location,description,created_by) values
('a2100000-0000-4000-8000-000000000001','Fictional dinner matching','weekly_session',now(),'Test room','Fixture','a2000000-0000-4000-8000-000000000001'),
('a2100000-0000-4000-8000-000000000002','Fictional other event','weekly_session',now(),'Test room','Fixture','a2000000-0000-4000-8000-000000000001');
insert into public.participants(id,full_name,email)
select ('a2200000-0000-4000-8000-00000000000'||i)::uuid, 'Fictional attendee '||i, 'dinner-match-'||i||'@example.test' from generate_series(1,7) i;
insert into public.dinner_eligibility_roster(full_name,email,recorded_by)
select 'Internal name '||i,'dinner-match-'||i||'@example.test','a2000000-0000-4000-8000-000000000001'
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
select is((select count(*)::int from public.dinner_eligibility_roster where email like 'dinner-match-%@example.test'),6,'administrator retains all preloaded internal entries');
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000002')),1,'standing roster eligibility applies to another event without re-entry');
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000099')),0,'missing event returns no participant identities');

select lives_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000001',true,false)$$,'authorised staff can tick a qualifying attendee as issued');
select ok((select issued_at is not null from public.list_event_dinner_service('a2100000-0000-4000-8000-000000000001') where participant_id='a2200000-0000-4000-8000-000000000001'),'issued state persists in the current event list');
select lives_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000001',true,false)$$,'a repeated serving request is idempotent');
select is((select count(*)::int from public.event_dinner_issuance where event_id='a2100000-0000-4000-8000-000000000001'),1,'repeated clicks produce one serving record');
select is((select issued_by::text from public.event_dinner_issuance where event_id='a2100000-0000-4000-8000-000000000001' and participant_id='a2200000-0000-4000-8000-000000000001'),'a2000000-0000-4000-8000-000000000001','operator identity is taken from the real session');
select throws_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002',true,false)$$,'PDI01',null,'a roster member without check-in cannot be marked served');
select lives_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000002','a2200000-0000-4000-8000-000000000006',true,false)$$,'the shared entitlement also allows serving at another event');
select is((select count(*)::int from public.dinner_eligibility_roster where is_active),6,'serving never consumes standing eligibility');
select throws_ok($$insert into public.event_dinner_issuance(event_id,participant_id,updated_by)values('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002','a2000000-0000-4000-8000-000000000001')$$,'42501',null,'direct serving writes are denied');

insert into public.attendance_records(event_id,participant_id)
values('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002');
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),2,'a later confirmed check-in appears without changing the roster');
update public.attendance_records set attendance_status='voided' where participant_id='a2200000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),1,'voiding attendance removes the matched attendee');
select ok((select issued_at is not null and not eligible from public.list_event_dinner_service('a2100000-0000-4000-8000-000000000001') where participant_id='a2200000-0000-4000-8000-000000000001'),'a correction cannot hide an already served meal');
select lives_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000001',false,true)$$,'staff may clear an erroneous serving mark after eligibility changes');
select throws_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002',true,true)$$,'40001',null,'a conflicting expected serving state requires a refresh');
update public.dinner_eligibility_roster set is_active=false where email='dinner-match-2@example.test';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),0,'removing roster membership removes the attendee');
update public.dinner_eligibility_roster set is_active=true where email='dinner-match-2@example.test';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),1,'restoring membership recalculates from current facts');
update public.registrations set registration_status='cancelled' where participant_id='a2200000-0000-4000-8000-000000000002';
select is((select count(*)::int from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')),0,'cancelled registration is excluded even with attendance and roster membership');
select is((select count(*)::int from public.dinner_eligibility_roster where email like 'dinner-match-%@example.test'),6,'attendance and registration corrections do not mutate the internal roster');

select set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000002',true);
select throws_ok($$select * from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'ordinary committee cannot read matched identities');
select is((select count(*)::int from public.dinner_eligibility_roster),0,'committee cannot read standing roster identities');
select throws_ok($$select * from public.list_event_dinner_service('a2100000-0000-4000-8000-000000000002')$$,'42501',null,'committee cannot read the event serving projection');
select throws_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000002','a2200000-0000-4000-8000-000000000006',false,true)$$,'42501',null,'committee cannot correct an issued mark');
select throws_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000002','a2200000-0000-4000-8000-000000000006',true,false)$$,'42501',null,'committee cannot record issuance');
reset role;
update public.profiles set can_manage_accounts=true where id='a2000000-0000-4000-8000-000000000002';
set local role authenticated;
select throws_ok($$select * from public.list_event_dinner_service('a2100000-0000-4000-8000-000000000002')$$,'42501',null,'committee account-management capability does not allow dinner access');
reset role;
update public.profiles set is_active=false where id='a2000000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub','a2000000-0000-4000-8000-000000000001',true);
select throws_ok($$select * from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'inactive authorised administrator cannot read matched identities');
select throws_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002',true,false)$$,'42501',null,'inactive administrator cannot record a serving');
reset role;
set local role anon;
select throws_ok($$select * from public.list_event_dinner_service('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous callers cannot list dinner service');
select throws_ok($$select * from public.list_matched_dinner_attendees('a2100000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous callers cannot execute the matching RPC');
select throws_ok($$select public.set_event_dinner_issued('a2100000-0000-4000-8000-000000000001','a2200000-0000-4000-8000-000000000002',true,false)$$,'42501',null,'anonymous callers cannot execute the serving RPC');
reset role;
select * from finish();
rollback;
