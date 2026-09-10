begin;
select plan(20);

insert into auth.users (instance_id, id, aud, role, email, confirmation_token, recovery_token, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '27000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'issue27-authorised@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '27000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'issue27-committee@example.test', '', '', '', '{}', '{}', now(), now());
insert into public.profiles(id, display_name, committee_role) values
  ('27000000-0000-4000-8000-000000000011', 'Fictional Registration Operator', 'authorised'),
  ('27000000-0000-4000-8000-000000000012', 'Fictional Committee Member', 'committee');
insert into public.events(id, event_type, name, starts_at, location, description, created_by) values
  ('27000000-0000-4000-8000-000000000021', 'weekly_session', 'Fictional Registration Event', now(), 'Fictional Room', 'Issue 27 fixture', '27000000-0000-4000-8000-000000000011');
insert into public.participants(id, full_name, email) values
  ('27000000-0000-4000-8000-000000000031', 'Fictional Registrant', 'issue27-person@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '27000000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
select set_config('request.jwt.claims', '{"sub":"27000000-0000-4000-8000-000000000011","role":"authenticated"}', true);
select lives_ok($$insert into public.registrations(event_id, participant_id) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000031')$$, 'authorised registration uses only granted columns');
select is((select registration_status::text from public.registrations where event_id='27000000-0000-4000-8000-000000000021'), 'registered', 'database defaults to Registered');
select is((select recorded_by::text from public.registrations where event_id='27000000-0000-4000-8000-000000000021'), '27000000-0000-4000-8000-000000000011', 'recorder comes from trusted auth.uid');
select throws_ok($$insert into public.registrations(event_id, participant_id) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000031')$$, '23505', null, 'duplicate pair is rejected atomically');
select is((select count(*)::integer from public.registrations where event_id='27000000-0000-4000-8000-000000000021'), 1, 'duplicate leaves one row');
select is((select registration_count::integer from public.get_event_participation_totals(array['27000000-0000-4000-8000-000000000021']::uuid[])), 1, 'first and repeated registration count once');
select lives_ok($$update public.registrations set registration_status='cancelled' where event_id='27000000-0000-4000-8000-000000000021'$$, 'authorised cancellation allowed');
select is((select registration_count::integer from public.get_event_participation_totals(array['27000000-0000-4000-8000-000000000021']::uuid[])), 0, 'cancelled row excluded from current count');
select throws_ok($$insert into public.registrations(event_id, participant_id) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000031')$$, '23505', null, 'repeated insert cannot replace cancelled row');
select is((select registration_status::text from public.registrations where event_id='27000000-0000-4000-8000-000000000021'), 'cancelled', 'cancelled state remains unchanged');
select lives_ok($$update public.registrations set registration_status='registered' where event_id='27000000-0000-4000-8000-000000000021'$$, 'authorised explicit restore allowed');
select is((select registration_count::integer from public.get_event_participation_totals(array['27000000-0000-4000-8000-000000000021']::uuid[])), 1, 'restore counts existing row once');
select throws_ok($$insert into public.registrations(event_id, participant_id, recorded_by) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000031', '27000000-0000-4000-8000-000000000012')$$, '42501', null, 'caller cannot insert audit actor');
select throws_ok($$insert into public.registrations(event_id, participant_id) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000099')$$, '23503', null, 'unknown participant cannot create a partial registration');

set local request.jwt.claim.sub = '27000000-0000-4000-8000-000000000012';
select set_config('request.jwt.claims', '{"sub":"27000000-0000-4000-8000-000000000012","role":"authenticated"}', true);
select is((select count(*)::integer from public.registrations), 0, 'committee cannot read registration rows');
select throws_ok($$insert into public.registrations(event_id, participant_id) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000031')$$, '42501', null, 'committee cannot register');
with changed as (update public.registrations set registration_status='cancelled' where event_id='27000000-0000-4000-8000-000000000021' returning id)
select is((select count(*)::integer from changed), 0, 'committee cannot update registrations');
select is((select registration_count::integer from public.get_event_participation_totals(array['27000000-0000-4000-8000-000000000021']::uuid[])), 1, 'committee receives safe aggregate only');

reset role;
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select throws_ok($$select * from public.registrations$$, '42501', null, 'anonymous roster read denied');
select throws_ok($$insert into public.registrations(event_id, participant_id) values ('27000000-0000-4000-8000-000000000021', '27000000-0000-4000-8000-000000000031')$$, '42501', null, 'anonymous registration denied');
reset role;
select * from finish();
rollback;
