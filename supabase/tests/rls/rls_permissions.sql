begin;

select plan(54);

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '91111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'rls-committee@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '92222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'rls-authorised@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '93333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'rls-no-profile@example.test', '', '', '', '{}', '{}', now(), now());

insert into public.profiles (id, display_name, committee_role) values
  ('91111111-1111-4111-8111-111111111111', 'RLS Committee Tester', 'committee'),
  ('92222222-2222-4222-8222-222222222222', 'RLS Authorised Tester', 'authorised');

insert into public.meetings (id, title, starts_at, summary, created_by) values
  ('93000000-0000-4000-8000-000000000001', 'RLS Fixture Meeting', now(), 'Fictional RLS fixture.', '92222222-2222-4222-8222-222222222222');
insert into public.meeting_attendees (meeting_id, profile_id) values
  ('93000000-0000-4000-8000-000000000001', '91111111-1111-4111-8111-111111111111'),
  ('93000000-0000-4000-8000-000000000001', '92222222-2222-4222-8222-222222222222');
insert into public.events (id, event_type, name, starts_at, location, description, created_by) values
  ('94000000-0000-4000-8000-000000000001', 'weekly_session', 'RLS Fixture Event', now(), 'Test Room', 'Fictional RLS fixture.', '92222222-2222-4222-8222-222222222222');
insert into public.participants (id, full_name, email) values
  ('96000000-0000-4000-8000-000000000001', 'RLS Participant', 'rls-participant@example.test');
insert into public.registrations (id, event_id, participant_id, recorded_by) values
  ('97000000-0000-4000-8000-000000000001', '94000000-0000-4000-8000-000000000001', '96000000-0000-4000-8000-000000000001', '92222222-2222-4222-8222-222222222222');
insert into public.attendance_records (id, event_id, participant_id, check_in_method, recorded_by) values
  ('98000000-0000-4000-8000-000000000001', '94000000-0000-4000-8000-000000000001', '96000000-0000-4000-8000-000000000001', 'manual', '92222222-2222-4222-8222-222222222222');

select has_function('private', 'is_backend_user', array[]::text[], 'backend role helper exists');
select has_function('private', 'is_authorised', array[]::text[], 'authorised role helper exists');
select has_function(
  'private',
  'has_other_meeting_attendee',
  array['uuid', 'uuid'],
  'meeting attendee guard helper exists'
);
select has_function(
  'public',
  'get_event_participation_totals',
  array['uuid[]'],
  'safe participation aggregate exists'
);

select policies_are(
  'public',
  'profiles',
  array['profiles_backend_select'],
  'profiles are read-only for backend users'
);
select policies_are(
  'public',
  'event_check_in_tokens',
  array[]::text[],
  'token table has no browser policies'
);

select table_privs_are('public', 'profiles', 'anon', array[]::text[], 'anon has no profile grants');
select table_privs_are('public', 'participants', 'anon', array[]::text[], 'anon has no participant grants');
select table_privs_are('public', 'registrations', 'anon', array[]::text[], 'anon has no registration grants');
select table_privs_are('public', 'attendance_records', 'anon', array[]::text[], 'anon has no attendance grants');
select table_privs_are('public', 'event_check_in_tokens', 'anon', array[]::text[], 'anon has no token grants');
select table_privs_are('public', 'event_check_in_tokens', 'authenticated', array[]::text[], 'authenticated has no token grants');

select table_privs_are('public', 'profiles', 'authenticated', array['SELECT'], 'profiles cannot be changed by app users');
select table_privs_are('public', 'meetings', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'meetings exclude delete');
select table_privs_are('public', 'tasks', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'tasks exclude delete');
select table_privs_are('public', 'events', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'events exclude delete');
select table_privs_are('public', 'participants', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'participant grants are policy-limited');
select table_privs_are('public', 'registrations', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'registration grants exclude delete');
select table_privs_are('public', 'attendance_records', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'attendance grants exclude delete');

select policies_are(
  'public',
  'participants',
  array[
    'participants_authorised_insert',
    'participants_authorised_select',
    'participants_authorised_update'
  ],
  'participant details are authorised-only'
);
select policies_are(
  'public',
  'registrations',
  array[
    'registrations_authorised_insert',
    'registrations_authorised_select',
    'registrations_authorised_update'
  ],
  'registration details are authorised-only'
);
select policies_are(
  'public',
  'attendance_records',
  array[
    'attendance_records_authorised_insert',
    'attendance_records_authorised_select',
    'attendance_records_authorised_update'
  ],
  'attendance details are authorised-only'
);

select policies_are(
  'public',
  'tasks',
  array['tasks_backend_insert', 'tasks_backend_select', 'tasks_backend_update'],
  'tasks are available to backend users without delete'
);
select policies_are(
  'public',
  'events',
  array['events_backend_insert', 'events_backend_select', 'events_backend_update'],
  'events are available to backend users without delete'
);

select function_privs_are('private', 'is_backend_user', array[]::text[], 'anon', array[]::text[], 'anon cannot execute backend helper');
select function_privs_are('private', 'is_authorised', array[]::text[], 'anon', array[]::text[], 'anon cannot execute authorised helper');
select function_privs_are('private', 'has_other_meeting_attendee', array['uuid', 'uuid'], 'anon', array[]::text[], 'anon cannot execute attendee guard helper');
select function_privs_are('public', 'get_event_participation_totals', array['uuid[]'], 'anon', array[]::text[], 'anon cannot execute aggregate');
select function_privs_are('private', 'is_backend_user', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated can execute backend helper');
select function_privs_are('private', 'is_authorised', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated can execute authorised helper');
select function_privs_are('private', 'has_other_meeting_attendee', array['uuid', 'uuid'], 'authenticated', array['EXECUTE'], 'authenticated can execute attendee guard helper');
select function_privs_are('public', 'get_event_participation_totals', array['uuid[]'], 'authenticated', array['EXECUTE'], 'authenticated can execute safe aggregate');

select trigger_is('public', 'meetings', 'meetings_reject_created_by_change', 'private', 'reject_created_by_change', 'meeting creator is immutable');
select trigger_is('public', 'tasks', 'tasks_reject_created_by_change', 'private', 'reject_created_by_change', 'task creator is immutable');
select trigger_is('public', 'events', 'events_reject_created_by_change', 'private', 'reject_created_by_change', 'event creator is immutable');
select trigger_is('public', 'tasks', 'tasks_reject_source_change', 'private', 'reject_task_source_change', 'task sources are immutable');
select trigger_is(
  'public',
  'meeting_attendees',
  'meeting_attendees_prevent_last_delete',
  'private',
  'prevent_last_meeting_attendee_delete',
  'meeting attendee deletion keeps at least one attendee'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated"}';

select is(
  (select count(*)::integer from public.meetings where id = '93000000-0000-4000-8000-000000000001'),
  1,
  'committee can read the non-sensitive meeting fixture'
);
select lives_ok(
  $$insert into public.meetings (title, starts_at, summary, created_by) values ('Committee Meeting', now(), 'Fictional committee write.', '91111111-1111-4111-8111-111111111111')$$,
  'committee can create a meeting with its own audit identity'
);
select is((select count(*)::integer from public.participants), 0, 'committee cannot read participant details');
select throws_ok(
  $$insert into public.participants (full_name, email) values ('Denied Participant', 'denied-participant@example.test')$$,
  '42501', null, 'committee cannot insert participant details'
);
select is(
  (select registration_count::integer from public.get_event_participation_totals(array['94000000-0000-4000-8000-000000000001'::uuid])),
  1,
  'committee can read only the safe registration aggregate'
);
select throws_ok(
  $$update public.profiles set committee_role = 'authorised' where id = '91111111-1111-4111-8111-111111111111'$$,
  '42501', null, 'committee cannot self-promote'
);
select throws_ok(
  $$insert into public.events (event_type, name, starts_at, location, description, created_by) values ('weekly_session', 'Forged Event', now(), 'Test Room', 'Rejected audit forgery.', '92222222-2222-4222-8222-222222222222')$$,
  '42501', null, 'committee cannot forge an event creator'
);
select throws_ok(
  $$delete from public.meeting_attendees where meeting_id = '93000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'a bulk delete cannot remove the final meeting attendee'
);

set local request.jwt.claims = '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated"}';

select is(
  (select count(*)::integer from public.participants where id = '96000000-0000-4000-8000-000000000001'),
  1,
  'authorised can read the participant fixture'
);
select lives_ok(
  $$insert into public.participants (id, full_name, email) values ('96000000-0000-4000-8000-000000000002', 'Authorised Participant', 'authorised-participant@example.test')$$,
  'authorised can create participant details'
);
select lives_ok(
  $$insert into public.registrations (event_id, participant_id, recorded_by) values ('94000000-0000-4000-8000-000000000001', '96000000-0000-4000-8000-000000000002', '92222222-2222-4222-8222-222222222222')$$,
  'authorised can create a registration with its own audit identity'
);
select throws_ok(
  $$update public.registrations set recorded_by = '91111111-1111-4111-8111-111111111111' where id = '97000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'authorised cannot forge a registration audit identity'
);

set local request.jwt.claims = '{"sub":"93333333-3333-4333-8333-333333333333","role":"authenticated"}';

select is((select count(*)::integer from public.meetings), 0, 'authenticated user without a profile cannot read backend rows');
select throws_ok(
  $$insert into public.meetings (title, starts_at, summary, created_by) values ('No Profile Meeting', now(), 'Rejected write.', '93333333-3333-4333-8333-333333333333')$$,
  '42501', null, 'authenticated user without a profile cannot create backend rows'
);
select throws_ok(
  $$select * from public.event_check_in_tokens$$,
  '42501', null, 'authenticated browser cannot read check-in tokens'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$select * from public.meetings$$,
  '42501', null, 'anonymous user cannot read business tables'
);
select throws_ok(
  $$select * from public.get_event_participation_totals(array['94000000-0000-4000-8000-000000000001'::uuid])$$,
  '42501', null, 'anonymous user cannot execute the aggregate RPC'
);

reset role;

select * from finish();
rollback;
