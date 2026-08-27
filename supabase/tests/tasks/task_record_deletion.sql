begin;
select plan(13);

truncate table auth.users cascade;
insert into auth.users (instance_id, id, aud, role, email, confirmation_token, recovery_token, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', 'b1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'task-committee@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'task-authorised@example.test', '', '', '', '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'task-no-profile@example.test', '', '', '', '{}', '{}', now(), now());
insert into public.profiles (id, display_name, committee_role) values
  ('b1111111-1111-4111-8111-111111111111', 'Task Committee Tester', 'committee'),
  ('b2222222-2222-4222-8222-222222222222', 'Task Authorised Tester', 'authorised');

select has_function('public', 'delete_task_record', array['uuid'], 'narrow task delete RPC exists');
select function_privs_are('public', 'delete_task_record', array['uuid'], 'anon', array[]::text[], 'anonymous users cannot execute task deletion');
select function_privs_are('public', 'delete_task_record', array['uuid'], 'authenticated', array['EXECUTE'], 'authenticated backend users may call the guarded delete boundary');
select table_privs_are('public', 'tasks', 'authenticated', array['SELECT'], 'task writes stay column-scoped and direct delete remains unavailable');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);

create temporary table direct_task (id uuid not null);
with inserted as (
  insert into public.tasks (title, description, assignee_id, due_date, created_by)
  values ('Disposable fictional task', 'Safe deletion evidence.', 'b1111111-1111-4111-8111-111111111111', '2026-09-01', 'b1111111-1111-4111-8111-111111111111')
  returning id
)
insert into direct_task select id from inserted;

select is(public.delete_task_record((select id from direct_task)), 'deleted', 'a committee user can delete a task');
select is((select count(*)::integer from public.tasks t join direct_task d on d.id = t.id), 0, 'the task row is deleted');
select is(public.delete_task_record((select id from direct_task)), 'not_found', 'repeated deletion reports not found');

create temporary table source_meeting as
select public.create_meeting_record('Fictional source meeting', '2026-08-27T08:30:00Z', 'Source retention evidence.', array['b1111111-1111-4111-8111-111111111111'::uuid]) as id;
create temporary table source_decision (id uuid not null);
with inserted as (
  insert into public.meeting_decisions (meeting_id, content, position)
  select id, 'Fictional source decision.', 0 from source_meeting
  returning id
)
insert into source_decision select id from inserted;
create temporary table source_task (id uuid not null);
with inserted as (
  insert into public.tasks (title, description, assignee_id, due_date, source_meeting_id, source_decision_id, created_by)
  select 'Fictional sourced task', 'Deleting it must retain the source.', 'b1111111-1111-4111-8111-111111111111', '2026-09-02', meeting.id, decision.id, 'b1111111-1111-4111-8111-111111111111'
  from source_meeting meeting cross join source_decision decision
  returning id
)
insert into source_task select id from inserted;

select is(public.delete_task_record((select id from source_task)), 'deleted', 'a sourced task can be deleted');
select is((select count(*)::integer from public.tasks t join source_task s on s.id = t.id), 0, 'the sourced task row is deleted');
select is((select count(*)::integer from public.meetings m join source_meeting s on s.id = m.id), 1, 'task deletion preserves the source meeting');
select is((select count(*)::integer from public.meeting_decisions d join source_decision s on s.id = d.id), 1, 'task deletion preserves the source decision');

select set_config('request.jwt.claim.sub', 'b2222222-2222-4222-8222-222222222222', true);
create temporary table authorised_task (id uuid not null);
with inserted as (
  insert into public.tasks (title, description, assignee_id, due_date, created_by)
  values ('Authorised disposable task', 'Authorised role evidence.', 'b2222222-2222-4222-8222-222222222222', '2026-09-03', 'b2222222-2222-4222-8222-222222222222')
  returning id
)
insert into authorised_task select id from inserted;
select is(public.delete_task_record((select id from authorised_task)), 'deleted', 'an authorised user can delete a task');

select set_config('request.jwt.claim.sub', 'b3333333-3333-4333-8333-333333333333', true);
select throws_ok(
  $$select public.delete_task_record('b5555555-5555-4555-8555-555555555555')$$,
  '42501', null, 'authenticated users without a backend profile cannot delete tasks'
);

select * from finish();
rollback;
