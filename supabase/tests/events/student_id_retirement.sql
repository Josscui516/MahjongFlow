begin;
select plan(12);
select ok(not exists(select 1 from public.events where requires_student_id), 'existing events no longer require a student ID');
insert into auth.users(id,email) values
 ('ed111111-1111-4111-8111-111111111111','retired-committee@example.test'),
 ('ed222222-2222-4222-8222-222222222222','retired-authorised@example.test');
insert into public.profiles(id,display_name,committee_role) values
 ('ed111111-1111-4111-8111-111111111111','Fictional committee','committee'),
 ('ed222222-2222-4222-8222-222222222222','Fictional authorised','authorised');
set local role authenticated;
select set_config('request.jwt.claim.sub','ed111111-1111-4111-8111-111111111111',true);
select lives_ok($$insert into public.events(name,event_type,starts_at,location,description,created_by)
 values('Fictional open event','weekly_session',now(),'Fictional room','Test','ed111111-1111-4111-8111-111111111111')$$,'committee creates an event without an ID requirement');
reset role;
update public.events set id='ed444444-4444-4444-8444-444444444444' where name='Fictional open event' and created_by='ed111111-1111-4111-8111-111111111111';
set local role authenticated;
select throws_ok($$update public.events set requires_student_id=true where id='ed444444-4444-4444-8444-444444444444'$$,'23514',null,'committee cannot re-enable the retired feature');
select lives_ok($$select public.submit_member_list_change('registration','add','retired-guest@example.test','Fictional Guest','ed444444-4444-4444-8444-444444444444',null)$$,'committee submits a registration without a student ID');
select is((select count(*)::integer from public.participants where email='retired-guest@example.test'),0,'committee still cannot read participant details');
select set_config('request.jwt.claim.sub','ed222222-2222-4222-8222-222222222222',true);
select is((select count(*)::integer from public.registrations where event_id='ed444444-4444-4444-8444-444444444444'),1,'authorised can verify the no-ID registration');
select is((select student_id from public.participants where email='retired-guest@example.test'),null::text,'no student ID is invented or collected');
select lives_ok($$update public.events set name='Fictional renamed event' where id='ed444444-4444-4444-8444-444444444444'$$,'authorised can edit ordinary event details');
select throws_ok($$update public.events set requires_student_id=true where id='ed444444-4444-4444-8444-444444444444'$$,'23514',null,'authorised cannot re-enable the retired feature');
set local role anon;
select throws_ok($$insert into public.events(name,event_type,starts_at,location,description,created_by) values('Denied','weekly_session',now(),'Room','Test','ed111111-1111-4111-8111-111111111111')$$,'42501',null,'anonymous event creation remains denied');
select throws_ok($$update public.events set requires_student_id=true where id='ed444444-4444-4444-8444-444444444444'$$,'42501',null,'anonymous event update remains denied');
reset role;
select is((select requires_student_id from public.events where id='ed444444-4444-4444-8444-444444444444'),false,'all write paths leave the requirement disabled');
select * from finish();
rollback;
