begin;

select plan(92);

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
select has_function('public', 'get_check_in_context', array['text'], 'minimum check-in context RPC exists');
select has_function('public', 'submit_event_check_in', array['text', 'text', 'text'], 'atomic check-in RPC exists');
select has_function('public', 'rotate_event_check_in_token', array['uuid', 'uuid'], 'token rotation RPC exists');

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
select table_privs_are('public', 'participants', 'authenticated', array['SELECT'], 'participants have no whole-table write grant');
select table_privs_are('public', 'registrations', 'authenticated', array['SELECT'], 'registrations have no whole-table write grant');
select table_privs_are('public', 'attendance_records', 'authenticated', array['SELECT'], 'attendance has no whole-table write grant');
select column_privs_are('public', 'participants', 'full_name', 'authenticated', array['INSERT', 'SELECT', 'UPDATE'], 'participant name is writable by authorised policy');
select column_privs_are('public', 'participants', 'id', 'authenticated', array['SELECT'], 'participant identity is database-owned');
select column_privs_are('public', 'registrations', 'registration_status', 'authenticated', array['SELECT', 'UPDATE'], 'registration status is correctable');
select column_privs_are('public', 'registrations', 'registered_at', 'authenticated', array['SELECT'], 'registration time is database-owned');
select column_privs_are('public', 'attendance_records', 'attendance_status', 'authenticated', array['SELECT', 'UPDATE'], 'attendance status is correctable');
select column_privs_are('public', 'attendance_records', 'check_in_method', 'authenticated', array['SELECT'], 'attendance method is trusted-boundary-owned');

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
select function_privs_are('public', 'get_check_in_context', array['text'], 'authenticated', array[]::text[], 'authenticated browser cannot execute context RPC');
select function_privs_are('public', 'submit_event_check_in', array['text', 'text', 'text'], 'authenticated', array[]::text[], 'authenticated browser cannot execute check-in RPC');
select function_privs_are('public', 'rotate_event_check_in_token', array['uuid', 'uuid'], 'authenticated', array[]::text[], 'authenticated browser cannot execute rotation RPC');
select function_privs_are('public', 'get_check_in_context', array['text'], 'service_role', array['EXECUTE'], 'trusted server can execute context RPC');
select function_privs_are('public', 'submit_event_check_in', array['text', 'text', 'text'], 'service_role', array['EXECUTE'], 'trusted server can execute check-in RPC');
select function_privs_are('public', 'rotate_event_check_in_token', array['uuid', 'uuid'], 'service_role', array['EXECUTE'], 'trusted server can execute rotation RPC');

select trigger_is('public', 'meetings', 'meetings_reject_created_by_change', 'private', 'reject_created_by_change', 'meeting creator is immutable');
select trigger_is('public', 'tasks', 'tasks_reject_created_by_change', 'private', 'reject_created_by_change', 'task creator is immutable');
select trigger_is('public', 'events', 'events_reject_created_by_change', 'private', 'reject_created_by_change', 'event creator is immutable');
select trigger_is('public', 'tasks', 'tasks_reject_source_change', 'private', 'reject_task_source_change', 'task sources are immutable');
select trigger_is('public', 'registrations', 'registrations_apply_trusted_fields', 'private', 'apply_trusted_registration_fields', 'registration provenance is database-controlled');
select trigger_is('public', 'attendance_records', 'attendance_records_apply_trusted_fields', 'private', 'apply_trusted_attendance_fields', 'attendance provenance is database-controlled');
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
select throws_ok(
  $$insert into public.participants (id, full_name, email) values ('96000000-0000-4000-8000-000000000002', 'Forged Identity', 'forged-identity@example.test')$$,
  '42501', null, 'authorised browser cannot choose a participant identity'
);
select throws_ok(
  $$insert into public.participants (full_name, email, created_at) values ('Forged Time', 'forged-time@example.test', '2000-01-01')$$,
  '42501', null, 'authorised browser cannot choose participant creation time'
);
select lives_ok(
  $$insert into public.participants (full_name, email) values ('Authorised Participant', 'authorised-participant@example.test')$$,
  'authorised can create participant details'
);
select throws_ok(
  $$update public.participants set created_at = '2000-01-01' where email = 'authorised-participant@example.test'$$,
  '42501', null, 'authorised browser cannot rewrite participant creation time'
);
select ok(
  (select created_at > statement_timestamp() - interval '1 minute' from public.participants where email = 'authorised-participant@example.test'),
  'participant keeps a database-generated creation time after rejection'
);
select lives_ok(
  $$insert into public.registrations (event_id, participant_id) select '94000000-0000-4000-8000-000000000001', id from public.participants where email = 'authorised-participant@example.test'$$,
  'authorised can create a registration with its own audit identity'
);
select is(
  (select recorded_by from public.registrations r join public.participants p on p.id = r.participant_id where p.email = 'authorised-participant@example.test'),
  '92222222-2222-4222-8222-222222222222'::uuid,
  'registration records the current authorised user'
);
select ok(
  (select registered_at > statement_timestamp() - interval '1 minute' from public.registrations r join public.participants p on p.id = r.participant_id where p.email = 'authorised-participant@example.test'),
  'registration time is database-generated'
);
select throws_ok(
  $$insert into public.registrations (id, event_id, participant_id) select '97000000-0000-4000-8000-000000000002', '94000000-0000-4000-8000-000000000001', id from public.participants where email = 'authorised-participant@example.test'$$,
  '42501', null, 'authorised browser cannot choose registration identity'
);
select throws_ok(
  $$insert into public.registrations (event_id, participant_id, registered_at) select '94000000-0000-4000-8000-000000000001', id, '2000-01-01' from public.participants where email = 'authorised-participant@example.test'$$,
  '42501', null, 'authorised browser cannot choose registration time'
);
select throws_ok(
  $$update public.registrations set event_id = '40000000-0000-4000-8000-000000000001' where id = '97000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'authorised browser cannot rewrite registration identity'
);
select throws_ok(
  $$update public.registrations set registered_at = '2000-01-01' where id = '97000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'authorised browser cannot rewrite registration time'
);
select throws_ok(
  $$update public.registrations set recorded_by = '91111111-1111-4111-8111-111111111111' where id = '97000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'authorised cannot forge a registration audit identity'
);
select lives_ok(
  $$update public.registrations set registration_status = 'cancelled' where id = '97000000-0000-4000-8000-000000000001'$$,
  'authorised can cancel the existing registration row'
);
select is(
  (select row(event_id, participant_id, registration_status::text, recorded_by)::text from public.registrations where id = '97000000-0000-4000-8000-000000000001'),
  '(94000000-0000-4000-8000-000000000001,96000000-0000-4000-8000-000000000001,cancelled,92222222-2222-4222-8222-222222222222)',
  'registration correction preserves identity and records the actor'
);

select lives_ok(
  $$insert into public.attendance_records (event_id, participant_id) select '94000000-0000-4000-8000-000000000001', id from public.participants where email = 'authorised-participant@example.test'$$,
  'authorised can create a trusted manual attendance record'
);
select is(
  (select row(check_in_method::text, attendance_status::text, recorded_by)::text from public.attendance_records a join public.participants p on p.id = a.participant_id where p.email = 'authorised-participant@example.test'),
  '(manual,confirmed,92222222-2222-4222-8222-222222222222)',
  'manual attendance provenance is database-controlled'
);
select ok(
  (select checked_in_at > statement_timestamp() - interval '1 minute' from public.attendance_records a join public.participants p on p.id = a.participant_id where p.email = 'authorised-participant@example.test'),
  'manual attendance time is database-generated'
);
select throws_ok(
  $$insert into public.attendance_records (event_id, participant_id, check_in_method) select '94000000-0000-4000-8000-000000000001', id, 'qr' from public.participants where email = 'authorised-participant@example.test'$$,
  '42501', null, 'authorised browser cannot claim QR provenance'
);
select throws_ok(
  $$insert into public.attendance_records (event_id, participant_id, checked_in_at) select '94000000-0000-4000-8000-000000000001', id, '2000-01-01' from public.participants where email = 'authorised-participant@example.test'$$,
  '42501', null, 'authorised browser cannot choose attendance time'
);
select throws_ok(
  $$update public.attendance_records set check_in_method = 'qr' where participant_id = (select id from public.participants where email = 'authorised-participant@example.test')$$,
  '42501', null, 'authorised browser cannot rewrite attendance provenance'
);
select throws_ok(
  $$update public.attendance_records set checked_in_at = '2000-01-01' where participant_id = (select id from public.participants where email = 'authorised-participant@example.test')$$,
  '42501', null, 'authorised browser cannot rewrite attendance time'
);
select lives_ok(
  $$update public.attendance_records set attendance_status = 'voided' where participant_id = (select id from public.participants where email = 'authorised-participant@example.test')$$,
  'authorised can void the existing attendance row'
);
select is(
  (select row(event_id, participant_id = p.id, check_in_method::text, attendance_status::text, recorded_by)::text from public.attendance_records a join public.participants p on p.id = a.participant_id where p.email = 'authorised-participant@example.test'),
  '(94000000-0000-4000-8000-000000000001,t,manual,voided,92222222-2222-4222-8222-222222222222)',
  'attendance correction preserves identity and provenance while recording the actor'
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
