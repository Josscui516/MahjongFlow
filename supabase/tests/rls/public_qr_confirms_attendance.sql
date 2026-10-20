begin;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new)
values('ac000000-0000-4000-8000-000000000001','authenticated','authenticated','qr-combined-operator@example.test','','','','');
insert into public.profiles(id,display_name,committee_role,can_manage_accounts)
values('ac000000-0000-4000-8000-000000000001','Fictional QR operator','authorised',true);
insert into public.events(id,name,event_type,starts_at,location,description,check_in_opens_at,check_in_closes_at,created_by)
values('ac100000-0000-4000-8000-000000000001','Fictional QR attendance','weekly_session',now(),'Test room','Fixture',now()-interval '1 hour',now()+interval '1 hour','ac000000-0000-4000-8000-000000000001');
insert into public.event_check_in_tokens(event_id,token_digest,created_by)
values('ac100000-0000-4000-8000-000000000001',encode(extensions.digest(repeat('a',64),'sha256'),'hex'),'ac000000-0000-4000-8000-000000000001');
set local role service_role;
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional New Arrival',' QR-COMBINED-NEW@example.test ',true),'success','one public submission registers and confirms attendance');
reset role;
select is((select count(*)::int from public.registrations where event_id='ac100000-0000-4000-8000-000000000001'),1,'registration is created once');
select is((select count(*)::int from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001' and attendance_status='confirmed'),1,'confirmed attendance is created in the same transaction');
select ok((select check_in_method='qr' and recorded_by is null from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001'),'self check-in records QR provenance, not a forged staff operator');
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional New Arrival','qr-combined-new@example.test',true),'already_processed','repeated scan is idempotent');
select is((select count(*)::int from public.attendance_records where event_id='ac100000-0000-4000-8000-000000000001'),1,'repeat submission creates no duplicate attendance');
select is((select count(*)::int from public.dinner_eligibility_roster where email='qr-combined-new@example.test'),0,'self check-in never adds standing dinner eligibility');
select is(public.submit_event_registration(repeat('a',64),'Fictional Preregistered','qr-combined-existing@example.test',true),'success','registration-only primitive remains available');
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional Preregistered','qr-combined-existing@example.test',true),'success','an already registered person can confirm attendance by scanning');
select is(public.submit_event_self_check_in(repeat('a',64),'Wrong Identity','qr-combined-existing@example.test',true),'unable_to_process','identity mismatch is not accepted');
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional No Consent','qr-combined-no-consent@example.test',false),'unable_to_process','consent is still required');
select is(public.submit_event_self_check_in('invalid','Fictional Probe','qr-combined-probe@example.test',true),'unavailable','invalid tokens cannot confirm attendance');
reset role;
insert into public.participants(id,full_name,email)values('ac200000-0000-4000-8000-000000000001','Fictional Voided','qr-combined-voided@example.test');
insert into public.attendance_records(event_id,participant_id,check_in_method,attendance_status,recorded_by)
values('ac100000-0000-4000-8000-000000000001','ac200000-0000-4000-8000-000000000001','manual','voided','ac000000-0000-4000-8000-000000000001');
set local role service_role;
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional Voided','qr-combined-voided@example.test',true),'unable_to_process','public scanning cannot undo a staff-voided attendance');
reset role;
select is((select count(*)::int from public.registrations where participant_id='ac200000-0000-4000-8000-000000000001'),0,'refusing a voided attendance rolls back registration creation');
select is((select attendance_status::text from public.attendance_records where participant_id='ac200000-0000-4000-8000-000000000001'),'voided','staff correction is retained');
reset role;
update public.registrations set registration_status='cancelled' where participant_id=(select id from public.participants where email='qr-combined-existing@example.test');
set local role service_role;
select is(public.submit_event_self_check_in(repeat('a',64),'Fictional Preregistered','qr-combined-existing@example.test',true),'unable_to_process','staff cancellation is not restored by a rescan');
reset role;
insert into public.dinner_eligibility_roster(full_name,email,recorded_by)values('Internal different name','qr-combined-new@example.test','ac000000-0000-4000-8000-000000000001');
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ac000000-0000-4000-8000-000000000001';
select is((select count(*)::int from public.list_matched_dinner_attendees('ac100000-0000-4000-8000-000000000001')),1,'matching standing member appears for dinner without another staff check-in');
select throws_ok($$select public.submit_event_self_check_in(repeat('a',64),'Fictional Probe','qr-combined-probe@example.test',true)$$,'42501',null,'browser session cannot call the elevated primitive directly');
reset role;
set local role anon;
select throws_ok($$select public.submit_event_self_check_in(repeat('a',64),'Fictional Probe','qr-combined-probe@example.test',true)$$,'42501',null,'anonymous sessions must use the protected application endpoint');
reset role;
select * from finish();
rollback;
