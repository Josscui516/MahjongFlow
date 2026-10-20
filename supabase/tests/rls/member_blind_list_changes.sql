begin;
select no_plan();
insert into auth.users(id,aud,role,email,confirmation_token,recovery_token,email_change,email_change_token_new) values
('ad000000-0000-4000-8000-000000000001','authenticated','authenticated','blind-committee@example.test','','','',''),
('ad000000-0000-4000-8000-000000000002','authenticated','authenticated','blind-safety@example.test','','','','');
insert into public.profiles(id,display_name,committee_role,can_manage_accounts)values
('ad000000-0000-4000-8000-000000000001','Fictional blind member','committee',false),
('ad000000-0000-4000-8000-000000000002','Fictional safety member','authorised',false);
insert into public.events(id,name,event_type,starts_at,location,description,created_by)
values('ad100000-0000-4000-8000-000000000001','Fictional private submissions','weekly_session',now(),'Test room','Fixture','ad000000-0000-4000-8000-000000000001');
set local role authenticated;
set local request.jwt.claim.role='authenticated';
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000001';
select lives_ok($$select public.submit_member_list_change('dinner','add',' BLIND-MEMBER@example.test ','Fictional Known Member')$$,'committee can add standing eligibility without a developer role');
select lives_ok($$select public.submit_member_list_change('dinner','add','blind-member@example.test','Different submitted name')$$,'duplicate acknowledgement is identical and does not reveal stored identity');
select is((select count(*)::int from public.dinner_eligibility_roster),0,'committee cannot read the full dinner roster after writing');
select lives_ok($$select public.submit_member_list_change('registration','add','blind-member@example.test','Fictional Known Member','ad100000-0000-4000-8000-000000000001')$$,'committee can register a known identity without reading a directory');
select is((select count(*)::int from public.registrations),0,'committee cannot read registration records after writing');
select is((select count(*)::int from public.participants),0,'committee cannot read participant identities after writing');
select lives_ok($$select public.submit_member_list_change('registration','add','blind-member@example.test','Wrong submitted name','ad100000-0000-4000-8000-000000000001')$$,'identity mismatch does not reveal the stored identity');
select lives_ok($$select public.submit_member_list_change('registration','remove','blind-member@example.test',null,'ad100000-0000-4000-8000-000000000001')$$,'committee can cancel a known registration');
select lives_ok($$select public.submit_member_list_change('registration','remove','blind-missing@example.test',null,'ad100000-0000-4000-8000-000000000001')$$,'a missing registration gives the same acknowledgement');
select lives_ok($$select public.submit_member_list_change('dinner','remove','blind-member@example.test')$$,'committee can remove a known standing eligibility');
select lives_ok($$select public.submit_member_list_change('dinner','remove','blind-missing@example.test')$$,'a missing standing member gives the same acknowledgement');
select throws_ok($$select public.submit_member_list_change('invalid','add','blind-probe@example.test','Fictional Probe')$$,'22023',null,'invalid operation scope is rejected');
reset role;
select is((select full_name from public.dinner_eligibility_roster where email='blind-member@example.test'),'Fictional Known Member','a blind duplicate cannot overwrite the existing name');
select is((select is_active from public.dinner_eligibility_roster where email='blind-member@example.test'),false,'removal disables membership without erasing history');
select is((select r.registration_status::text from public.registrations r join public.participants p on p.id=r.participant_id where r.event_id='ad100000-0000-4000-8000-000000000001' and p.email='blind-member@example.test'),'cancelled','registration removal cancels the row');
select is((select count(*)::int from public.attendance_records where event_id='ad100000-0000-4000-8000-000000000001'),0,'staff registration does not invent attendance');
set local role authenticated;
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000002';
select is((select count(*)::int from public.dinner_eligibility_roster where email='blind-member@example.test'),1,'safety staff can view full roster details without developer privileges');
select lives_ok($$update public.dinner_eligibility_roster set is_active=true where email='blind-member@example.test'$$,'safety staff can maintain membership without developer privileges');
reset role;
update public.profiles set is_active=false where id='ad000000-0000-4000-8000-000000000001';
set local role authenticated;
set local request.jwt.claim.sub='ad000000-0000-4000-8000-000000000001';
select throws_ok($$select public.submit_member_list_change('dinner','add','blind-probe@example.test','Fictional Probe')$$,'42501',null,'inactive members cannot submit changes');
reset role;
set local role anon;
select throws_ok($$select public.submit_member_list_change('dinner','add','blind-probe@example.test','Fictional Probe')$$,'42501',null,'anonymous sessions cannot submit changes');
reset role;
select is(pg_get_function_result('public.submit_member_list_change(text,text,text,text,uuid,text)'::regprocedure),'void','the write interface cannot return private records or existence status');
select * from finish();
rollback;
