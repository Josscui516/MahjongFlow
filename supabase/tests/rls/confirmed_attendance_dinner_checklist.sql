begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new)
values('ad000000-0000-4000-8000-000000000001','authenticated','authenticated','fictional-dinner-staff@example.test','','','',''),
('ad000000-0000-4000-8000-000000000002','authenticated','authenticated','fictional-dinner-committee@example.test','','','','');
insert into public.profiles(id,display_name,committee_role)
values('ad000000-0000-4000-8000-000000000001','Fictional Staff','authorised'),('ad000000-0000-4000-8000-000000000002','Fictional Committee','committee');
insert into public.events(id,name,event_type,starts_at,location,description,created_by)
values('ad100000-0000-4000-8000-000000000001','Fictional Dinner','weekly_session',now(),'Fixture room','Fixture','ad000000-0000-4000-8000-000000000001');
insert into public.participants(id,full_name,email) values('ad200000-0000-4000-8000-000000000001','Fictional Confirmed','fictional-confirmed@example.test'),('ad200000-0000-4000-8000-000000000002','Fictional Unconfirmed','fictional-unconfirmed@example.test');
insert into public.registrations(event_id,participant_id,recorded_by) select 'ad100000-0000-4000-8000-000000000001',id,'ad000000-0000-4000-8000-000000000001' from public.participants where id in ('ad200000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000002');
insert into public.attendance_records(event_id,participant_id,check_in_method,recorded_by) values('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001','manual','ad000000-0000-4000-8000-000000000001');
set local role authenticated;
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.list_event_dinner_service('ad100000-0000-4000-8000-000000000001')),1,'confirmed attendee appears without shared roster membership');
select ok(public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001',true,false) is not null,'confirmed attendee can be marked');
select is(public.get_event_dinner_eligibility_total('ad100000-0000-4000-8000-000000000001'),1,'safe count matches marked confirmed attendees');
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000002';
select is(public.get_event_dinner_eligibility_total('ad100000-0000-4000-8000-000000000001'),1,'General sees the marked total');
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000001';
select lives_ok($$select public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001',true,false)$$,'repeat marking is idempotent');
select throws_ok($$select public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000002',true,false)$$,'PDI01',null,'unconfirmed attendee cannot be marked');
select throws_ok($$select public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001',false,false)$$,'40001',null,'conflicting state rejected');
select ok(public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001',false,true) is null,'uncheck persists');
select is(public.get_event_dinner_eligibility_total('ad100000-0000-4000-8000-000000000001'),0,'safe count updates after uncheck');
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000002';
select is(public.get_event_dinner_eligibility_total('ad100000-0000-4000-8000-000000000001'),0,'General can read safe count');
select is(public.get_event_dinner_eligibility_total('ad100000-0000-4000-8000-000000000099'),null::integer,'unknown event is unavailable rather than zero');
select is((select count(*)::int from public.event_dinner_issuance where event_id='ad100000-0000-4000-8000-000000000001'),0,'General cannot read individual marks through RLS');
select throws_ok($$select public.list_event_dinner_service('ad100000-0000-4000-8000-000000000001')$$,'42501',null,'committee cannot read');
select throws_ok($$select public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001',true,false)$$,'42501',null,'committee cannot mark');
reset role;
set local role anon;
select throws_ok($$select public.get_event_dinner_eligibility_total('ad100000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous cannot read safe count');
select throws_ok($$select public.list_event_dinner_service('ad100000-0000-4000-8000-000000000001')$$,'42501',null,'anonymous cannot read');
select throws_ok($$select public.set_event_dinner_issued('ad100000-0000-4000-8000-000000000001','ad200000-0000-4000-8000-000000000001',true,false)$$,'42501',null,'anonymous cannot mark');
reset role;
select * from finish();
rollback;
