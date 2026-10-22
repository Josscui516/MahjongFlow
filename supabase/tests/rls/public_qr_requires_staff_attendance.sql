begin;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new)
values('ac000000-0000-4000-8000-000000000001','authenticated','authenticated','qr-operator@example.test','','','',''),
('ac000000-0000-4000-8000-000000000002','authenticated','authenticated','qr-committee@example.test','','','','');
insert into public.profiles(id,display_name,committee_role,can_manage_accounts)
values('ac000000-0000-4000-8000-000000000001','Fictional QR operator','authorised',true),
('ac000000-0000-4000-8000-000000000002','Fictional committee','committee',false);
insert into public.events(id,name,event_type,starts_at,location,description,check_in_opens_at,check_in_closes_at,created_by)
values('ac100000-0000-4000-8000-000000000001','Fictional QR registration','weekly_session',now(),'Test room','Fixture',now()-interval '1 hour',now()+interval '1 hour','ac000000-0000-4000-8000-000000000001');
insert into public.event_check_in_tokens(event_id,token_digest,created_by)
values('ac100000-0000-4000-8000-000000000001',encode(extensions.digest(repeat('a',64),'sha256'),'hex'),'ac000000-0000-4000-8000-000000000001');
set local role service_role;
select is(public.submit_event_registration(repeat('a',64),'Fictional Arrival',' QR-STAFF-NEW@example.test ',true),'success','public submission registers');
select is(public.submit_event_registration(repeat('a',64),'Fictional Arrival','qr-staff-new@example.test',true),'already_processed','duplicate registration is idempotent');
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional Legacy','qr-staff-legacy@example.test',true),'success','legacy endpoint also registers only');
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional Legacy','qr-staff-legacy@example.test',true),'already_processed','legacy repeat is idempotent');
select is(public.submit_event_registration(repeat('a',64),'Wrong Identity','qr-staff-new@example.test',true),'unable_to_process','identity mismatch is rejected');
select is(public.submit_event_registration(repeat('a',64),'Fictional No Consent','qr-staff-no-consent@example.test',false),'unable_to_process','consent remains required');
select is(public.submit_event_registration('invalid','Fictional Probe','qr-staff-probe@example.test',true),'unavailable','invalid tokens are denied');
reset role;
select is((select count(*)::int from public.registrations where event_id='ac100000-0000-4000-8000-000000000001'),2,'two unique registrations');
select is((select count(*)::int from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001'),0,'neither public endpoint creates attendance');
insert into public.dinner_eligibility_roster(full_name,email,recorded_by)
values('Fictional roster name','qr-staff-new@example.test','ac000000-0000-4000-8000-000000000001');
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ac000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.list_matched_dinner_attendees('ac100000-0000-4000-8000-000000000001')),0,'registration alone does not grant dinner collection');
select lives_ok($$insert into public.attendance_records(event_id,participant_id) select 'ac100000-0000-4000-8000-000000000001',id from public.participants where email='qr-staff-new@example.test'$$,'authorised staff can mark attendance');
select is((select count(*)::int from public.list_matched_dinner_attendees('ac100000-0000-4000-8000-000000000001')),1,'staff-confirmed attendance enables matching dinner eligibility');
reset role;
select ok((select check_in_method='manual' and recorded_by='ac000000-0000-4000-8000-000000000001' from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001'),'manual provenance records the trusted staff actor');
set local role service_role;
select is(public.submit_event_registration(repeat('a',64),'Fictional Arrival','qr-staff-new@example.test',true),'already_processed','rescan after staff confirmation remains a duplicate registration');
reset role;
select is((select count(*)::int from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001'),1,'rescan cannot add attendance');
update public.attendance_records set attendance_status='voided' where event_id='ac100000-0000-4000-8000-000000000001';
set local role service_role;
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional Arrival','qr-staff-new@example.test',true),'already_processed','legacy rescan cannot restore attendance');
reset role;
select is((select attendance_status::text from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001'),'voided','staff correction is preserved');
update public.registrations set registration_status='cancelled' where participant_id=(select id from public.participants where email='qr-staff-legacy@example.test');
set local role service_role;
select is(public.submit_event_registration(repeat('a',64),'Fictional Legacy','qr-staff-legacy@example.test',true),'unable_to_process','staff cancellation is not restored');
reset role;
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ac000000-0000-4000-8000-000000000002';
select throws_ok($$insert into public.attendance_records(event_id,participant_id) values('ac100000-0000-4000-8000-000000000001',(select id from public.participants where email='qr-staff-legacy@example.test'))$$,'42501',null,'committee cannot mark attendance');
select throws_ok($$select public.submit_event_registration(repeat('a',64),'Fictional Probe','qr-staff-probe@example.test',true)$$,'42501',null,'committee cannot call privileged registration RPC');
select throws_ok($$select public.submit_event_self_check_in(repeat('a',64),'Fictional Probe','qr-staff-probe@example.test',true)$$,'42501',null,'committee cannot call legacy RPC');
reset role;
set local role anon;
select throws_ok($$select public.submit_event_registration(repeat('a',64),'Fictional Probe','qr-staff-probe@example.test',true)$$,'42501',null,'anonymous must use application registration endpoint');
select throws_ok($$select public.submit_event_self_check_in(repeat('a',64),'Fictional Probe','qr-staff-probe@example.test',true)$$,'42501',null,'anonymous cannot bypass using legacy RPC');
reset role;
select * from finish();
rollback;
