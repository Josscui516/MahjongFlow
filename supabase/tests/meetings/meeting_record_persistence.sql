begin;
select plan(31);

truncate table auth.users cascade;
insert into auth.users (instance_id, id, aud, role, email, confirmation_token, recovery_token, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'meeting-committee@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'meeting-authorised@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'meeting-no-profile@example.test', '', '', '', '{}', '{}', now(), now());
insert into public.profiles (id, display_name, committee_role) values
  ('a1111111-1111-4111-8111-111111111111', 'Meeting Committee Tester', 'committee'),
  ('a2222222-2222-4222-8222-222222222222', 'Meeting Authorised Tester', 'authorised');

select has_function('public', 'create_meeting_record', array['text', 'timestamp with time zone', 'text', 'uuid[]'], 'atomic create RPC exists');
select has_function('public', 'update_meeting_record', array['uuid', 'text', 'timestamp with time zone', 'text', 'uuid[]'], 'atomic update RPC exists');
select has_function('public', 'delete_meeting_record', array['uuid'], 'narrow meeting delete RPC exists');
select function_privs_are('public', 'create_meeting_record', array['text', 'timestamp with time zone', 'text', 'uuid[]'], 'anon', array[]::text[], 'anon cannot execute meeting create');
select function_privs_are('public', 'update_meeting_record', array['uuid', 'text', 'timestamp with time zone', 'text', 'uuid[]'], 'authenticated', array['EXECUTE'], 'authenticated may call the RLS-protected update boundary');
select function_privs_are('public', 'delete_meeting_record', array['uuid'], 'anon', array[]::text[], 'anonymous users cannot execute meeting deletion');
select function_privs_are('public', 'delete_meeting_record', array['uuid'], 'authenticated', array['EXECUTE'], 'authenticated backend users may call the guarded delete boundary');
select table_privs_are('public', 'meetings', 'authenticated', array['SELECT'], 'authenticated users still have no direct meeting delete grant');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);

create temporary table created_meeting as
select public.create_meeting_record(
  'Fictional Sprint 3 meeting',
  '2026-08-20T08:30:00Z',
  'Fictional meeting persistence evidence.',
  array['a1111111-1111-4111-8111-111111111111'::uuid]
) as id;

select is((select count(*)::integer from public.meetings m join created_meeting c on c.id = m.id), 1, 'M-01 creates one meeting');
select is((select count(*)::integer from public.meeting_attendees a join created_meeting c on c.id = a.meeting_id), 1, 'M-01 creates its attendee atomically');
select is((select created_by from public.meetings m join created_meeting c on c.id = m.id), 'a1111111-1111-4111-8111-111111111111'::uuid, 'the JWT user owns the audit field');

select ok(public.update_meeting_record(
  (select id from created_meeting),
  'Updated fictional Sprint 3 meeting',
  '2026-08-21T08:30:00Z',
  'Updated fictional persistence evidence.',
  array['a2222222-2222-4222-8222-222222222222'::uuid]
), 'M-01 update succeeds');
select is((select title from public.meetings m join created_meeting c on c.id = m.id), 'Updated fictional Sprint 3 meeting', 'updated fields persist on re-read');
select is((select profile_id from public.meeting_attendees a join created_meeting c on c.id = a.meeting_id), 'a2222222-2222-4222-8222-222222222222'::uuid, 'attendee replacement remains non-empty');

select set_config('request.jwt.claim.sub', 'a2222222-2222-4222-8222-222222222222', true);
select ok(public.update_meeting_record(
  (select id from created_meeting),
  'Authorised fictional Sprint 3 meeting',
  '2026-08-21T09:30:00Z',
  'Authorised fictional persistence evidence.',
  array['a1111111-1111-4111-8111-111111111111'::uuid]
), 'M-01 permits an authorised user to update a meeting');
select is(
  (select title from public.meetings m join created_meeting c on c.id = m.id),
  'Authorised fictional Sprint 3 meeting',
  'the authorised update persists on re-read'
);

select throws_ok(
  format(
    $$select public.update_meeting_record(%L, 'Partially updated meeting', now(), 'Must roll back.', array['afffffff-ffff-4fff-8fff-ffffffffffff'::uuid])$$,
    (select id from created_meeting)
  ),
  '23503', null, 'invalid attendee rolls the whole meeting update back'
);
select is(
  (select title from public.meetings m join created_meeting c on c.id = m.id),
  'Authorised fictional Sprint 3 meeting',
  'failed update preserves the previous meeting fields'
);

select throws_ok(
  $$select public.create_meeting_record('Invalid attendee meeting', now(), 'Must roll back.', array['afffffff-ffff-4fff-8fff-ffffffffffff'::uuid])$$,
  '23503', null, 'invalid attendee rolls the whole meeting write back'
);
select is((select count(*)::integer from public.meetings where title = 'Invalid attendee meeting'), 0, 'failed create leaves no partial meeting');

select throws_ok(
  $$select public.create_meeting_record('Empty attendee meeting', now(), 'Must roll back.', array[]::uuid[])$$,
  '23514', null, 'an empty attendee set is rejected at the database boundary'
);
select is((select count(*)::integer from public.meetings where title = 'Empty attendee meeting'), 0, 'empty attendee rejection leaves no partial meeting');

insert into public.discussion_points (meeting_id, content, position)
select id, 'Fictional discussion to cascade.', 0 from created_meeting;
insert into public.meeting_decisions (meeting_id, content, position)
select id, 'Fictional decision to cascade.', 0 from created_meeting;

select is(public.delete_meeting_record((select id from created_meeting)), 'deleted', 'a backend user can delete an unlinked meeting');
select is((select count(*)::integer from public.meetings m join created_meeting c on c.id = m.id), 0, 'the meeting row is deleted');
select is((select count(*)::integer from public.meeting_attendees a join created_meeting c on c.id = a.meeting_id), 0, 'meeting attendees cascade with the meeting');
select is((select count(*)::integer from public.discussion_points p join created_meeting c on c.id = p.meeting_id), 0, 'discussion points cascade with the meeting');
select is((select count(*)::integer from public.meeting_decisions p join created_meeting c on c.id = p.meeting_id), 0, 'key decisions cascade with the meeting');

create temporary table linked_meeting as
select public.create_meeting_record(
  'Fictional linked meeting',
  '2026-08-23T08:30:00Z',
  'Fictional linked-task evidence.',
  array['a1111111-1111-4111-8111-111111111111'::uuid]
) as id;
create temporary table linked_decision (id uuid not null);
with inserted_decision as (
  insert into public.meeting_decisions (meeting_id, content, position)
  select id, 'Decision linked to a fictional task.', 0 from linked_meeting
  returning id
)
insert into linked_decision select id from inserted_decision;
insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, source_decision_id, created_by)
select 'Fictional linked task', 'Preserves meeting traceability.', 'a1111111-1111-4111-8111-111111111111', '2026-08-30', meeting.id, decision.id, 'a2222222-2222-4222-8222-222222222222'
from linked_meeting meeting cross join linked_decision decision;

select is(public.delete_meeting_record((select id from linked_meeting)), 'linked_tasks', 'a linked task blocks meeting deletion');
select is((select count(*)::integer from public.meetings m join linked_meeting l on l.id = m.id), 1, 'blocked deletion preserves the linked meeting');

select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', true);
select throws_ok(
  format($$select public.delete_meeting_record(%L)$$, (select id from linked_meeting)),
  '42501', null, 'authenticated users without a backend profile cannot delete meetings'
);
select throws_ok(
  $$select public.create_meeting_record('Forbidden meeting', now(), 'Must be rejected.', array['a1111111-1111-4111-8111-111111111111'::uuid])$$,
  '42501', null, 'M-05 rejects an authenticated user without a backend profile'
);

select * from finish();
rollback;
