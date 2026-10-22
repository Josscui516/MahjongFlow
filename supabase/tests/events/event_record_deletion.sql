begin;
select plan(10);
insert into auth.users (id, email) values
 ('e1111111-1111-4111-8111-111111111111','event-committee@example.test'),
 ('e2222222-2222-4222-8222-222222222222','event-authorised@example.test'),
 ('e3333333-3333-4333-8333-333333333333','event-no-profile@example.test');
insert into public.profiles (id,display_name,committee_role) values
 ('e1111111-1111-4111-8111-111111111111','Fictional committee','committee'),
 ('e2222222-2222-4222-8222-222222222222','Fictional authorised','authorised');
insert into public.events (id,name,event_type,starts_at,location,description,created_by) values
 ('e4444444-4444-4444-8444-444444444444','Disposable fictional event','weekly_session','2026-11-01T08:00:00Z','Fictional room','Test','e1111111-1111-4111-8111-111111111111'),
 ('e5555555-5555-4555-8555-555555555555','Protected fictional event','weekly_session','2026-11-01T08:00:00Z','Fictional room','Test','e1111111-1111-4111-8111-111111111111'),
 ('e6666666-6666-4666-8666-666666666666','Authorised fictional event','weekly_session','2026-11-01T08:00:00Z','Fictional room','Test','e2222222-2222-4222-8222-222222222222');
insert into public.tasks (title,description,assignee_id,due_date,event_id,created_by) values
 ('Fictional linked task','Retain this task','e1111111-1111-4111-8111-111111111111','2026-11-01','e5555555-5555-4555-8555-555555555555','e1111111-1111-4111-8111-111111111111');
select function_privs_are('public','delete_event_record',array['uuid'],'anon',array[]::text[],'anonymous has no RPC permission');
select ok(not has_table_privilege('authenticated','public.events','DELETE'),'direct table deletion remains denied');
set local role authenticated;
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select is(public.delete_event_record('e4444444-4444-4444-8444-444444444444'),'deleted','committee deletes unlinked event');
select is(public.delete_event_record('e4444444-4444-4444-8444-444444444444'),'not_found','repeat delete reports not found');
select is(public.delete_event_record('e5555555-5555-4555-8555-555555555555'),'linked_records','linked task blocks deletion');
select is((select count(*)::integer from public.events where id='e5555555-5555-4555-8555-555555555555'),1,'blocked event remains');
select is((select count(*)::integer from public.tasks where event_id='e5555555-5555-4555-8555-555555555555'),1,'linked task remains');
select set_config('request.jwt.claim.sub','e2222222-2222-4222-8222-222222222222',true);
select is(public.delete_event_record('e6666666-6666-4666-8666-666666666666'),'deleted','authorised deletes unlinked event');
select set_config('request.jwt.claim.sub','e3333333-3333-4333-8333-333333333333',true);
select throws_ok($$select public.delete_event_record('e5555555-5555-4555-8555-555555555555')$$,'42501',null,'no profile rejected');
set local role anon;
select throws_ok($$select public.delete_event_record('e5555555-5555-4555-8555-555555555555')$$,'42501',null,'anonymous rejected');
select * from finish();
rollback;
