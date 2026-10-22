begin;
-- 历史回滚兼容性：仅在本事务撤销停用约束，验证仍保留的旧触发器与 RLS。
-- 当前停用合同由 events/student_id_retirement.sql 覆盖；rollback 恢复约束。
alter table public.events drop constraint events_student_id_requirement_retired;
select plan(41);

-- Make the test independent of whether db reset loaded seed.sql. TRUNCATE is
-- transactional in PostgreSQL, and the final rollback restores any seed data.
truncate table public.participants, auth.users cascade;

insert into auth.users (instance_id, id, aud, role, email, confirmation_token, recovery_token, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'committee01@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'authorised01@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'no-profile01@example.test', '', '', '', '{}', '{}', now(), now());
insert into public.profiles (id, display_name, committee_role) values
  ('11111111-1111-4111-8111-111111111111', 'Committee Tester', 'committee'),
  ('22222222-2222-4222-8222-222222222222', 'Authorised Tester', 'authorised');
insert into public.meetings (id, title, starts_at, summary, created_by) values
  ('30000000-0000-4000-8000-000000000001', 'Fixture Meeting', now(), 'Fictional test meeting.', '22222222-2222-4222-8222-222222222222'),
  ('30000000-0000-4000-8000-000000000002', 'Second Fixture Meeting', now(), 'Second fictional test meeting.', '22222222-2222-4222-8222-222222222222');
insert into public.discussion_points (id, meeting_id, content, position) values
  ('31000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Fixture discussion.', 0),
  ('31000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Referenced fixture discussion.', 1),
  ('31000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Unreferenced fixture discussion.', 2);
insert into public.meeting_decisions (id, meeting_id, content, position) values
  ('32000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Fixture decision.', 0),
  ('32000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', 'Second fixture decision.', 1),
  ('32000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', 'Unreferenced fixture decision.', 2);
insert into public.events (id, event_type, name, starts_at, location, description, requires_student_id, created_by) values
  ('40000000-0000-4000-8000-000000000001', 'weekly_session', 'Standard Fixture Event', now(), 'Test Room', 'Fictional standard event.', false, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000002', 'tournament', 'ID Fixture Event', now(), 'Test Room', 'Fictional ID event.', true, '22222222-2222-4222-8222-222222222222'),
  ('40000000-0000-4000-8000-000000000003', 'weekly_session', 'Attendance Fixture Event', now(), 'Test Room', 'Fictional attendance event.', false, '22222222-2222-4222-8222-222222222222');
insert into public.participants (id, full_name, email) values
  ('60000000-0000-4000-8000-000000000001', 'Participant Alpha', 'alpha@example.test'),
  ('60000000-0000-4000-8000-000000000002', 'Participant Beta', 'beta@example.test'),
  ('60000000-0000-4000-8000-000000000003', 'Participant Gamma', 'gamma@example.test');
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
select ok(
  exists (
    select 1 from supabase_migrations.schema_migrations
    where version > '20260811000200'
  )
  or not has_table_privilege('authenticated', 'public.tasks', 'select'),
  'authenticated has no task access before the policy migration'
);
select ok(
  exists (
    select 1 from supabase_migrations.schema_migrations
    where version > '20260811000200'
  )
  or not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'meetings', 'meeting_attendees', 'discussion_points', 'meeting_decisions', 'tasks', 'events', 'event_check_in_tokens', 'participants', 'registrations', 'attendance_records')
  ),
  'the first two migrations create no RLS policies'
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
  $$insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, created_by) values ('Meeting only', 'Invalid meeting-only source.', '11111111-1111-4111-8111-111111111111', current_date, '30000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$$,
  '23514', null, 'a task cannot reference only a source meeting'
);
select lives_ok(
  $$insert into public.tasks (title, description, assignee_id, due_date, created_by) values ('Independent task', 'Valid independent task.', '11111111-1111-4111-8111-111111111111', current_date, '22222222-2222-4222-8222-222222222222')$$,
  'an independent task has no source fields'
);
select lives_ok(
  $$insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, source_decision_id, created_by) values ('Decision conversion', 'Valid decision conversion.', '11111111-1111-4111-8111-111111111111', current_date, '30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222')$$,
  'a decision source includes its meeting'
);
select lives_ok(
  $$insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, source_discussion_point_id, created_by) values ('Discussion conversion', 'Valid discussion conversion.', '11111111-1111-4111-8111-111111111111', current_date, '30000000-0000-4000-8000-000000000001', '31000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222')$$,
  'a discussion source includes its meeting'
);
select throws_ok(
  $$update public.meeting_decisions set meeting_id = '30000000-0000-4000-8000-000000000002' where id = '32000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'a referenced decision cannot move outside its task source meeting'
);
select throws_ok(
  $$update public.discussion_points set meeting_id = '30000000-0000-4000-8000-000000000002' where id = '31000000-0000-4000-8000-000000000002'$$,
  '23514', null, 'a referenced discussion point cannot move outside its task source meeting'
);
select lives_ok(
  $$update public.meeting_decisions set meeting_id = '30000000-0000-4000-8000-000000000002' where id = '32000000-0000-4000-8000-000000000003'; update public.discussion_points set meeting_id = '30000000-0000-4000-8000-000000000002' where id = '31000000-0000-4000-8000-000000000003'$$,
  'unreferenced source rows remain reparentable'
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
  $$update public.events set requires_student_id = true where id = '40000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'an event cannot add a student ID requirement that existing registrations violate'
);
select lives_ok(
  $$update public.events set requires_student_id = true where id = '40000000-0000-4000-8000-000000000003'$$,
  'an event without registrations may add a student ID requirement'
);
select lives_ok(
  $$update public.participants set student_id = 'TEST-0003' where id = '60000000-0000-4000-8000-000000000003'; update public.participants set student_id = null where id = '60000000-0000-4000-8000-000000000003'$$,
  'an unregistered participant may clear their student ID'
);
select lives_ok(
  $$update public.participants set student_id = 'TEST-0002' where id = '60000000-0000-4000-8000-000000000002'; insert into public.registrations (event_id, participant_id, recorded_by) values ('40000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222')$$,
  'a participant with a student ID may register for a configured event'
);
select throws_ok(
  $$update public.participants set student_id = null where id = '60000000-0000-4000-8000-000000000002'$$,
  '23514', null, 'a participant cannot clear a student ID required by an existing registration'
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

select lives_ok(
  $$set constraints meeting_decisions_validate_task_sources deferred;
    update public.meeting_decisions set meeting_id = '30000000-0000-4000-8000-000000000002' where id = '32000000-0000-4000-8000-000000000001';
    update public.meeting_decisions set meeting_id = '30000000-0000-4000-8000-000000000001' where id = '32000000-0000-4000-8000-000000000001';
    set constraints meeting_decisions_validate_task_sources immediate$$,
  'a deferred task-source check accepts a temporary invalid state repaired before validation'
);
select throws_ok(
  $$set constraints meeting_decisions_validate_task_sources deferred;
    update public.meeting_decisions set meeting_id = '30000000-0000-4000-8000-000000000002' where id = '32000000-0000-4000-8000-000000000001';
    set constraints meeting_decisions_validate_task_sources immediate$$,
  '23514', null, 'a deferred task-source check rejects the final invalid state'
);
select lives_ok(
  $$set constraints events_validate_registration_student_ids deferred;
    update public.events set requires_student_id = true where id = '40000000-0000-4000-8000-000000000001';
    update public.events set requires_student_id = false where id = '40000000-0000-4000-8000-000000000001';
    set constraints events_validate_registration_student_ids immediate$$,
  'a deferred event check validates the repaired final requirement state'
);
select throws_ok(
  $$set constraints events_validate_registration_student_ids deferred;
    update public.events set requires_student_id = true where id = '40000000-0000-4000-8000-000000000001';
    set constraints events_validate_registration_student_ids immediate$$,
  '23514', null, 'a deferred event check rejects the final invalid requirement state'
);
select lives_ok(
  $$set constraints participants_validate_registration_student_ids deferred;
    update public.participants set student_id = null where id = '60000000-0000-4000-8000-000000000002';
    update public.participants set student_id = 'TEST-0002' where id = '60000000-0000-4000-8000-000000000002';
    set constraints participants_validate_registration_student_ids immediate$$,
  'a deferred participant check validates the restored final student ID'
);
select throws_ok(
  $$set constraints participants_validate_registration_student_ids deferred;
    update public.participants set student_id = null where id = '60000000-0000-4000-8000-000000000002';
    set constraints participants_validate_registration_student_ids immediate$$,
  '23514', null, 'a deferred participant check rejects the final missing student ID'
);

grant select, update on public.events to authenticated;
create policy test_backend_event_select on public.events
  for select to authenticated
  using (auth.uid() in (
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid
  ));
create policy test_backend_event_update on public.events
  for update to authenticated
  using (auth.uid() in (
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid
  ))
  with check (auth.uid() in (
    '11111111-1111-4111-8111-111111111111'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid
  ));

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';
select throws_ok(
  $$update public.events set requires_student_id = true where id = '40000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'committee RLS cannot hide violating registrations from the integrity trigger'
);
reset role;
select is(
  (select requires_student_id from public.events where id = '40000000-0000-4000-8000-000000000001'),
  false,
  'the rejected committee update leaves the stored event requirement unchanged'
);
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select lives_ok(
  $$update public.events set requires_student_id = false
    where id = '40000000-0000-4000-8000-000000000003'$$,
  'authorised RLS retains an allowed event update'
);
set local request.jwt.claims = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select lives_ok(
  $$update public.events set requires_student_id = true
    where id = '40000000-0000-4000-8000-000000000003'$$,
  'a no-profile JWT update is safely filtered by RLS'
);
reset role;
select is(
  (select requires_student_id from public.events
   where id = '40000000-0000-4000-8000-000000000003'),
  false,
  'a no-profile JWT leaves the stored event unchanged'
);

select * from finish();
rollback;
