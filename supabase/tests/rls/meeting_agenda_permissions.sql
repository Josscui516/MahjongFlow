begin;

select plan(16);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  confirmation_token,
  recovery_token,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'agenda-committee@example.test',
  '',
  '',
  '',
  '{}',
  '{}',
  now(),
  now()
) on conflict (id) do nothing;

insert into public.profiles (id, display_name, committee_role) values (
  '11111111-1111-4111-8111-111111111111',
  'Agenda Committee Tester',
  'committee'
) on conflict (id) do nothing;

insert into public.meetings (id, title, starts_at, summary, created_by) values (
  '30000000-0000-4000-8000-000000000013',
  'Fictional Agenda Test Meeting',
  now(),
  'Validate ordered agenda persistence.',
  '11111111-1111-4111-8111-111111111111'
);
insert into public.meeting_attendees (meeting_id, profile_id) values
  ('30000000-0000-4000-8000-000000000013', '11111111-1111-4111-8111-111111111111'),
  ('30000000-0000-4000-8000-000000000013', '22222222-2222-4222-8222-222222222222');

select has_function(
  'public',
  'save_meeting_agenda',
  array['uuid', 'jsonb', 'jsonb'],
  'atomic meeting agenda function exists'
);
select function_privs_are(
  'public',
  'save_meeting_agenda',
  array['uuid', 'jsonb', 'jsonb'],
  'anon',
  array[]::text[],
  'anonymous users cannot save meeting agendas'
);
select function_privs_are(
  'public',
  'save_meeting_agenda',
  array['uuid', 'jsonb', 'jsonb'],
  'authenticated',
  array['EXECUTE'],
  'authenticated users reach the role-protected agenda function'
);
select policies_are(
  'public',
  'discussion_points',
  array[
    'discussion_points_backend_delete',
    'discussion_points_backend_insert',
    'discussion_points_backend_select',
    'discussion_points_backend_update'
  ],
  'discussion point access remains backend-only'
);
select policies_are(
  'public',
  'meeting_decisions',
  array[
    'meeting_decisions_backend_delete',
    'meeting_decisions_backend_insert',
    'meeting_decisions_backend_select',
    'meeting_decisions_backend_update'
  ],
  'meeting decision access remains backend-only'
);
select table_privs_are(
  'public',
  'discussion_points',
  'anon',
  array[]::text[],
  'anonymous users have no discussion point table grants'
);
select table_privs_are(
  'public',
  'meeting_decisions',
  'anon',
  array[]::text[],
  'anonymous users have no meeting decision table grants'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select lives_ok(
  $$select public.save_meeting_agenda(
    '30000000-0000-4000-8000-000000000013',
    '[{"content":"Venue options"},{"content":"Equipment needs"}]'::jsonb,
    '[{"content":"Book the east hall"},{"content":"Use blue tables"}]'::jsonb
  )$$,
  'committee users can atomically save two ordered items in each section'
);
select results_eq(
  $$select content, position from public.discussion_points
    where meeting_id = '30000000-0000-4000-8000-000000000013'
    order by position$$,
  $$values ('Venue options'::text, 0), ('Equipment needs'::text, 1)$$,
  'discussion points retain stable zero-based order and meeting ownership'
);
select results_eq(
  $$select content, position from public.meeting_decisions
    where meeting_id = '30000000-0000-4000-8000-000000000013'
    order by position$$,
  $$values ('Book the east hall'::text, 0), ('Use blue tables'::text, 1)$$,
  'decisions retain stable zero-based order and meeting ownership'
);

create temporary table agenda_stable_ids as
select id as discussion_id
from public.discussion_points
where meeting_id = '30000000-0000-4000-8000-000000000013'
  and position = 0;

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select lives_ok(
  $$select public.save_meeting_agenda(
    '30000000-0000-4000-8000-000000000013',
    (select jsonb_agg(jsonb_build_object(
      'id', id,
      'content', case when position = 0 then 'Updated discussion' else content end
    ) order by position) from public.discussion_points
      where meeting_id = '30000000-0000-4000-8000-000000000013'),
    (select jsonb_agg(jsonb_build_object(
      'id', id,
      'content', case when position = 0 then 'Updated decision' else content end
    ) order by position) from public.meeting_decisions
      where meeting_id = '30000000-0000-4000-8000-000000000013')
  )$$,
  'authorised users can replace a meeting agenda'
);
select results_eq(
  $$select content from public.meeting_decisions
    where meeting_id = '30000000-0000-4000-8000-000000000013'
    order by position$$,
  $$values ('Updated decision'::text), ('Use blue tables'::text)$$,
  'authorised replacement is persisted without duplicate positions'
);
select results_eq(
  $$select id from public.discussion_points
    where meeting_id = '30000000-0000-4000-8000-000000000013'
      and position = 0$$,
  $$select discussion_id from agenda_stable_ids$$,
  'editing an existing item preserves its stable source id'
);

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-4333-8333-333333333333',
  true
);
select throws_ok(
  $$select public.save_meeting_agenda(
    '30000000-0000-4000-8000-000000000013',
    '[{"content":"Forbidden"}]'::jsonb,
    '[{"content":"Forbidden"}]'::jsonb
  )$$,
  '42501',
  'resource unavailable',
  'authenticated users without a backend profile are denied'
);

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
select throws_ok(
  $$select public.save_meeting_agenda(
    '30000000-0000-4000-8000-000000000001',
    '[{"content":"This must roll back"}]'::jsonb,
    '[{"content":"A referenced decision cannot be replaced"}]'::jsonb
  )$$,
  '23503',
  null,
  'a referenced source blocks replacement and rolls back the whole agenda'
);
select results_eq(
  $$select content from public.discussion_points
    where id = '31000000-0000-4000-8000-000000000001'$$,
  $$values ('Discuss the room layout.'::text)$$,
  'failed replacement leaves the original discussion point unchanged'
);

select * from finish();
rollback;
