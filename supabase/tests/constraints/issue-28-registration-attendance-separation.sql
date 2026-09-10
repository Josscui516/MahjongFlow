begin;
select plan(20);

insert into auth.users (instance_id, id, aud, role, email, confirmation_token, recovery_token, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '28000000-0000-4000-8000-000000000011', 'authenticated', 'authenticated', 'issue28-authorised@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '28000000-0000-4000-8000-000000000012', 'authenticated', 'authenticated', 'issue28-committee@example.test', '', '', '', '{}', '{}', now(), now());
insert into public.profiles(id, display_name, committee_role) values
  ('28000000-0000-4000-8000-000000000011', 'Fictional Registration Operator', 'authorised'),
  ('28000000-0000-4000-8000-000000000012', 'Fictional Committee Member', 'committee');
insert into public.events(id, event_type, name, starts_at, location, description, created_by) values
  ('28000000-0000-4000-8000-000000000021', 'weekly_session', 'Fictional Registration Event', now(), 'Fictional Room', 'Issue 28 fixture', '28000000-0000-4000-8000-000000000011');
insert into public.participants(id, full_name, email) values
  ('28000000-0000-4000-8000-000000000031', 'Fictional Registrant', 'issue28-person@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '28000000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
select set_config('request.jwt.claims', '{"sub":"28000000-0000-4000-8000-000000000011","role":"authenticated"}', true);
select lives_ok($$insert into public.registrations(event_id, participant_id, privacy_notice_acknowledged_at) values ('28000000-0000-4000-8000-000000000021','28000000-0000-4000-8000-000000000031',null)$$, 'back-office registration permits explicit null acknowledgement');
select ok((select privacy_notice_acknowledged_at is null from public.registrations where event_id='28000000-0000-4000-8000-000000000021'), 'no consent is fabricated');
select is((select count(*)::integer from public.attendance_records where event_id='28000000-0000-4000-8000-000000000021'), 0, 'registration creates no attendance row');
select is((select registration_count::integer from public.get_event_participation_totals(array['28000000-0000-4000-8000-000000000021']::uuid[])), 1, 'registered total is one');
select is((select attendance_count::integer from public.get_event_participation_totals(array['28000000-0000-4000-8000-000000000021']::uuid[])), 0, 'confirmed attendance remains zero');
select lives_ok($$update public.registrations set privacy_notice_acknowledged_at=registered_at where event_id='28000000-0000-4000-8000-000000000021'$$, 'existing authorised acknowledgement can be represented');
select throws_ok($$insert into public.registrations(event_id,participant_id,privacy_notice_acknowledged_at) values ('28000000-0000-4000-8000-000000000021','28000000-0000-4000-8000-000000000031',null)$$, '23505', null, 'duplicate registration cannot overwrite consent');
select is((select privacy_notice_acknowledged_at from public.registrations where event_id='28000000-0000-4000-8000-000000000021'), (select registered_at from public.registrations where event_id='28000000-0000-4000-8000-000000000021'), 'duplicate preserves acknowledgement');
select lives_ok($$update public.registrations set registration_status='cancelled' where event_id='28000000-0000-4000-8000-000000000021'$$, 'cancel remains available');
select is((select privacy_notice_acknowledged_at from public.registrations where event_id='28000000-0000-4000-8000-000000000021'), (select registered_at from public.registrations where event_id='28000000-0000-4000-8000-000000000021'), 'cancel preserves acknowledgement');
select is((select count(*)::integer from public.attendance_records where event_id='28000000-0000-4000-8000-000000000021'), 0, 'cancel does not create attendance');
select lives_ok($$update public.registrations set registration_status='registered' where event_id='28000000-0000-4000-8000-000000000021'$$, 'restore remains available');
select is((select count(*)::integer from public.attendance_records where event_id='28000000-0000-4000-8000-000000000021'), 0, 'restore does not create attendance');
select lives_ok($$insert into public.attendance_records(event_id,participant_id) values ('28000000-0000-4000-8000-000000000021','28000000-0000-4000-8000-000000000031')$$, 'explicit independent attendance fixture is permitted');
select results_eq($$select registration_count::integer,attendance_count::integer from public.get_event_participation_totals(array['28000000-0000-4000-8000-000000000021']::uuid[])$$, $$select 1,1$$, 'counts follow their separate tables');
select lives_ok($$update public.registrations set registration_status='cancelled' where event_id='28000000-0000-4000-8000-000000000021'$$, 'cancellation with attendance is permitted');
select results_eq($$select registration_count::integer,attendance_count::integer from public.get_event_participation_totals(array['28000000-0000-4000-8000-000000000021']::uuid[])$$, $$select 0,1$$, 'cancellation does not remove attendance');
set local request.jwt.claim.sub = '28000000-0000-4000-8000-000000000012';
select set_config('request.jwt.claims', '{"sub":"28000000-0000-4000-8000-000000000012","role":"authenticated"}', true);
select results_eq($$select registration_count::integer,attendance_count::integer from public.get_event_participation_totals(array['28000000-0000-4000-8000-000000000021']::uuid[])$$, $$select 0,1$$, 'committee receives safe independent totals');
select is((select count(*)::integer from public.registrations), 0, 'committee cannot read consent or registration details');
reset role;
set local role anon;
select throws_ok($$select * from public.get_event_participation_totals(array['28000000-0000-4000-8000-000000000021']::uuid[])$$, '42501', null, 'anonymous aggregate access denied');
reset role;
select * from finish();
rollback;
