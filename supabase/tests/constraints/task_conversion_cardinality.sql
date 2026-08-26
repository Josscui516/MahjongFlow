begin;
select plan(6);

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '91000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'conversion-assignee@example.test',
  '', '', '', '{}', '{}', now(), now()
);
insert into public.profiles (id, display_name, committee_role) values (
  '91000000-0000-4000-8000-000000000001',
  'Conversion Assignee',
  'committee'
);

select is(
  (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'assignee_id'
  ),
  'uuid',
  'a task stores one scalar UUID assignee'
);

select is(
  (
    select is_nullable
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tasks'
      and column_name = 'assignee_id'
  ),
  'NO',
  'a task requires its primary assignee'
);

select throws_ok(
  $$insert into public.tasks (title, description, due_date, created_by)
    values (
      'Missing assignee',
      'Fictional invalid converted task.',
      '2026-09-04',
      '91000000-0000-4000-8000-000000000001'
    )$$,
  '23502',
  null,
  'the database rejects a converted task without an assignee'
);

select throws_ok(
  $$insert into public.tasks (
      title, description, assignee_id, due_date, created_by
    ) values (
      'Two assignees',
      'Fictional invalid converted task.',
      array[
        '91000000-0000-4000-8000-000000000001'::uuid,
        '91000000-0000-4000-8000-000000000002'::uuid
      ],
      '2026-09-04',
      '91000000-0000-4000-8000-000000000001'
    )$$,
  '42804',
  null,
  'the database rejects an assignee array'
);

select lives_ok(
  $$insert into public.tasks (
      title, description, assignee_id, due_date, status, created_by
    ) values (
      'Valid conversion',
      'Fictional valid converted task.',
      '91000000-0000-4000-8000-000000000001',
      '2026-09-04',
      'not_started',
      '91000000-0000-4000-8000-000000000001'
    )$$,
  'the database accepts exactly one assignee'
);

select is(
  (
    select count(*)::integer
    from public.tasks
    where title = 'Valid conversion'
      and assignee_id = '91000000-0000-4000-8000-000000000001'
  ),
  1,
  'the valid conversion persists one task with one assignee'
);

select * from finish();
rollback;
