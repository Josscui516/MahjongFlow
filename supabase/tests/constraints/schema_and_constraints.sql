begin;
select plan(18);

-- Make the test independent of whether db reset loaded seed.sql. TRUNCATE is
-- transactional in PostgreSQL, and the final rollback restores any seed data.
truncate table public.participants, auth.users cascade;

insert into auth.users (instance_id, id, aud, role, email, confirmation_token, recovery_token, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'committee01@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'authorised01@example.test', '', '', '', '{}', '{}', now(), now());
insert into public.profiles (id, display_name, committee_role) values
  ('11111111-1111-4111-8111-111111111111', 'Committee Tester', 'committee'),
  ('22222222-2222-4222-8222-222222222222', 'Authorised Tester', 'authorised');
insert into public.meetings (id, title, starts_at, summary, created_by) values
  ('30000000-0000-4000-8000-000000000001', 'Fixture Meeting', now(), 'Fictional test meeting.', '22222222-2222-4222-8222-222222222222');
insert into public.discussion_points (id, meeting_id, content, position) values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Fixture discussion.', 0);
insert into public.meeting_decisions (id, meeting_id, content, position) values
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Fixture decision.', 0);
insert into public.events (id, event_type, name, starts_at, location, description, requires_student_id, created_by) values
  ('40000000-0000-4000-8000-000000000001', 'weekly_session', 'Standard Fixture Event', now(), 'Test Room', 'Fictional standard event.', false, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000002', 'tournament', 'ID Fixture Event', now(), 'Test Room', 'Fictional ID event.', true, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000003', 'weekly_session', 'Attendance Fixture Event', now(), 'Test Room', 'Fictional attendance event.', false, '22222222-2222-4222-8222-222222222222');
insert into public.participants (id, full_name, email) values
  ('60000000-0000-4000-8000-000000000001', 'Participant Alpha', 'alpha@example.test'),
  ('60000000-0000-4000-8000-000000000002', 'Participant Beta', 'beta@example.test');
insert into public.registrations (event_id, participant_id, recorded_by) values
  ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222');
insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, source_decision_id, event_id, created_by) values
  ('Existing conversion', 'Existing fictional source task.', '11111111-1111-4111-8111-111111111111', current_date, '30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222');

select is(
  (select count(*)::integer from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e' and t.typname in ('committee_role', 'task_status', 'event_type', 'event_status', 'registration_status', 'check_in_method', 'attendance_status')),
  7, 'all seven MVP enum types exist'
);
select is(
  (select count(*)::integer from information_schema.tables where table_schema = 'public' and table_name in ('profiles', 'meetings', 'meeting_attendees', 'discussion_points', 'meeting_decisions', 'tasks', 'events', 'event_check_in_tokens', 'participants', 'registrations', 'attendance_records')),
  11, 'all eleven MVP tables exist'
);
select is(
  (select count(*)::integer from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('profiles', 'meetings', 'meeting_attendees', 'discussion_points', 'meeting_decisions', 'tasks', 'events', 'event_check_in_tokens', 'participants', 'registrations', 'attendance_records') and c.relrowsecurity),
  11, 'RLS is enabled on every MVP table'
);
select ok(not has_table_privilege('anon', 'public.profiles', 'select'), 'anon has no profile access');
select ok(not has_table_privilege('authenticated', 'public.tasks', 'select'), 'authenticated has no task access');
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename in ('profiles', 'meetings', 'meeting_attendees', 'discussion_points', 'meeting_decisions', 'tasks', 'events', 'event_check_in_tokens', 'participants', 'registrations', 'attendance_records')),
  0, 'the first two migrations create no RLS policies'
);

select throws_ok(
  $$insert into public.participants (full_name, email) values ('Duplicate Email', 'alpha@example.test')$$,
  '23505', null, 'participant email is unique'
);
select throws_ok(
  $$insert into public.participants (full_name, email) values ('Invalid Email', 'UPPER@example.test')$$,
  '23514', null, 'participant email must already be normalised'
);
select throws_ok(
  $$insert into public.events (event_type, name, starts_at, location, description, check_in_opens_at, check_in_closes_at, created_by) values ('weekly_session', 'Bad Window', now(), 'Test Room', 'Invalid fictional window.', now(), now(), '22222222-2222-4222-8222-222222222222')$$,
  '23514', null, 'invalid check-in windows are rejected'
);
select throws_ok(
  $$insert into public.tasks (title, description, assignee_id, due_date, source_decision_id, source_discussion_point_id, created_by) values ('Two sources', 'Invalid task with two sources.', '11111111-1111-4111-8111-111111111111', current_date, '32000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$$,
  '23514', null, 'a task cannot reference two concrete sources'
);
select throws_ok(
  $$insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, source_decision_id, created_by) values ('Duplicate conversion', 'Duplicate source conversion.', '11111111-1111-4111-8111-111111111111', current_date, '30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$$,
  '23505', null, 'a decision can create only one task'
);
select throws_ok(
  $$insert into public.registrations (event_id, participant_id, recorded_by) values ('40000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222')$$,
  '23514', null, 'student ID is required by configured events'
);
select throws_ok(
  $$insert into public.registrations (event_id, participant_id, recorded_by) values ('40000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$$,
  '23505', null, 'an event and participant have only one registration'
);
select throws_ok(
  $$insert into public.attendance_records (event_id, participant_id, check_in_method) values ('40000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002', 'manual')$$,
  '23514', null, 'manual attendance requires a recorder'
);
select throws_ok(
  $$insert into public.attendance_records (event_id, participant_id, check_in_method) values ('40000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000002', 'qr')$$,
  '23514', null, 'QR attendance requires an active registration'
);
select throws_ok(
  $$update public.profiles set created_at = created_at - interval '1 day' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', null, 'created_at is immutable'
);
select throws_ok(
  $$insert into public.meetings (title, starts_at, summary, created_by) values ('Missing Creator', now(), 'Invalid fictional meeting.', '99999999-9999-4999-8999-999999999999')$$,
  '23503', null, 'meeting creator must reference a profile'
);
select throws_ok(
  $$delete from public.events where id = '40000000-0000-4000-8000-000000000001'$$,
  '23503', null, 'events with business history cannot be deleted'
);

select * from finish();
rollback;
