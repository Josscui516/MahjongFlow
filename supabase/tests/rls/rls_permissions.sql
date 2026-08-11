begin;

select plan(33);

select has_function('private', 'is_backend_user', array[]::text[], 'backend role helper exists');
select has_function('private', 'is_authorised', array[]::text[], 'authorised role helper exists');
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
select function_privs_are('public', 'get_event_participation_totals', array['uuid[]'], 'anon', array[]::text[], 'anon cannot execute aggregate');
select function_privs_are('private', 'is_backend_user', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated can execute backend helper');
select function_privs_are('private', 'is_authorised', array[]::text[], 'authenticated', array['EXECUTE'], 'authenticated can execute authorised helper');
select function_privs_are('public', 'get_event_participation_totals', array['uuid[]'], 'authenticated', array['EXECUTE'], 'authenticated can execute safe aggregate');

select trigger_is('public', 'meetings', 'meetings_reject_created_by_change', 'private', 'reject_created_by_change', 'meeting creator is immutable');
select trigger_is('public', 'tasks', 'tasks_reject_created_by_change', 'private', 'reject_created_by_change', 'task creator is immutable');
select trigger_is('public', 'events', 'events_reject_created_by_change', 'private', 'reject_created_by_change', 'event creator is immutable');
select trigger_is('public', 'tasks', 'tasks_reject_source_change', 'private', 'reject_task_source_change', 'task sources are immutable');

select * from finish();
rollback;
