begin;

select plan(35);

-- Keep the evidence independent of optional seed data. TRUNCATE and every
-- fixture below are rolled back at the end of the test.
truncate table public.participants, auth.users cascade;

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'c6111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'issue-26-committee@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'c6222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'issue-26-authorised@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'c6333333-3333-4333-8333-333333333333',
    'authenticated', 'authenticated', 'issue-26-no-profile@example.test',
    '', '', '', '{}', '{}', now(), now()
  );

insert into public.profiles (
  id, display_name, committee_role, is_active
) values
  (
    'c6111111-1111-4111-8111-111111111111',
    'Issue 26 Committee', 'committee', true
  ),
  (
    'c6222222-2222-4222-8222-222222222222',
    'Issue 26 Authorised', 'authorised', true
  );

insert into public.events (
  id, event_type, name, starts_at, location, description,
  requires_student_id, created_by
) values
  (
    'c6400000-0000-4000-8000-000000000001',
    'weekly_session', 'Issue 26 ordinary event', now(), 'Fictional Room',
    'Fictional event that does not require a student ID.', false,
    'c6222222-2222-4222-8222-222222222222'
  ),
  (
    'c6400000-0000-4000-8000-000000000002',
    'tournament', 'Issue 26 identity event', now(), 'Fictional Hall',
    'Fictional event that requires a student ID.', true,
    'c6222222-2222-4222-8222-222222222222'
  );

insert into public.participants (
  id, full_name, email, student_id
) values (
  'c6500000-0000-4000-8000-000000000001',
  'RLS Visibility Probe', 'issue-26-rls-probe@example.test', null
);

select is(
  (
    select array_agg(column_name order by ordinal_position)::text
    from information_schema.columns
    where table_schema = 'public' and table_name = 'participants'
  ),
  '{id,full_name,email,student_id,created_at,updated_at}',
  'participants stores only the approved minimum identity and audit fields'
);

select is(
  (
    select count(*)::integer
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'participants'
      and constraint_type = 'FOREIGN KEY'
  ),
  0,
  'a participant is not a profile or an authentication account'
);

select ok(
  (
    select relrowsecurity
    from pg_catalog.pg_class
    where oid = 'public.participants'::regclass
  ),
  'row-level security is enabled for participant identities'
);

select policies_are(
  'public',
  'participants',
  array[
    'participants_authorised_insert',
    'participants_authorised_select',
    'participants_authorised_update'
  ],
  'participant identities have only authorised policies'
);

select table_privs_are(
  'public', 'participants', 'anon', array[]::text[],
  'anonymous sessions have no participant table privileges'
);

select table_privs_are(
  'public', 'participants', 'authenticated', array['SELECT'],
  'authenticated writes remain restricted to approved columns'
);

select column_privs_are(
  'public', 'participants', 'full_name', 'authenticated',
  array['INSERT', 'SELECT', 'UPDATE'],
  'authorised policy may control the participant name business field'
);

select column_privs_are(
  'public', 'participants', 'student_id', 'authenticated',
  array['INSERT', 'SELECT', 'UPDATE'],
  'authorised policy may control the optional student ID field'
);

select column_privs_are(
  'public', 'participants', 'id', 'authenticated', array['SELECT'],
  'participant UUIDs remain database-owned'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  'c6111111-1111-4111-8111-111111111111',
  true
);

select is(
  (select count(*)::integer from public.participants),
  0,
  'committee users cannot read an existing participant identity'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values ('Denied Participant', 'issue-26-denied@example.test')$$,
  '42501', null,
  'committee users cannot create participant identities'
);

update public.participants
set full_name = 'Committee Must Not Update'
where email = 'issue-26-rls-probe@example.test';

select set_config(
  'request.jwt.claim.sub',
  'c6333333-3333-4333-8333-333333333333',
  true
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values ('No Profile Participant', 'issue-26-no-profile-write@example.test')$$,
  '42501', null,
  'authenticated users without an active profile cannot create participants'
);

update public.participants
set full_name = 'No Profile Must Not Update'
where email = 'issue-26-rls-probe@example.test';

select set_config(
  'request.jwt.claim.sub',
  'c6222222-2222-4222-8222-222222222222',
  true
);

select is(
  (
    select full_name
    from public.participants
    where email = 'issue-26-rls-probe@example.test'
  ),
  'RLS Visibility Probe',
  'committee and no-profile updates cannot change participant identities'
);

select lives_ok(
  $$insert into public.participants (full_name, email)
    values ('Fictional Participant', 'fictional.participant@example.test')$$,
  'an authorised user can create a canonical minimum participant'
);

select ok(
  (
    select id is not null
      and id <> '00000000-0000-0000-0000-000000000000'::uuid
    from public.participants
    where email = 'fictional.participant@example.test'
  ),
  'the database creates a non-zero internal participant UUID'
);

select ok(
  (
    select created_at is not null
      and updated_at is not null
      and created_at = updated_at
    from public.participants
    where email = 'fictional.participant@example.test'
  ),
  'the database creates participant audit timestamps'
);

select results_eq(
  $$update public.participants
    set student_id = 'TEST-RLS-2600'
    where email = 'issue-26-rls-probe@example.test'
    returning student_id$$,
  $$values ('TEST-RLS-2600'::text)$$,
  'an authorised user can atomically fill a missing participant student ID'
);

select is(
  (
    select student_id
    from public.participants
    where email = 'fictional.participant@example.test'
  ),
  null::text,
  'student ID remains null when it is not required'
);

select lives_ok(
  $$insert into public.registrations (event_id, participant_id)
    select 'c6400000-0000-4000-8000-000000000001', id
    from public.participants
    where email = 'fictional.participant@example.test'$$,
  'an ordinary event accepts a participant without a student ID'
);

select throws_ok(
  $$insert into public.registrations (event_id, participant_id)
    select 'c6400000-0000-4000-8000-000000000002', id
    from public.participants
    where email = 'fictional.participant@example.test'$$,
  '23514', null,
  'an event requiring identity rejects a participant without a student ID'
);

select is(
  (
    select count(*)::integer
    from public.registrations
    where event_id = 'c6400000-0000-4000-8000-000000000002'
  ),
  0,
  'a rejected required-ID registration leaves no partial registration row'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values (' Padded Participant ', 'issue-26-padded@example.test')$$,
  '23514', null,
  'the database rejects outer participant-name whitespace'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values ('Repeated  Space', 'issue-26-repeat-space@example.test')$$,
  '23514', null,
  'the database rejects non-canonical repeated name whitespace'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values (E'Tab\tName', 'issue-26-tab-name@example.test')$$,
  '23514', null,
  'the database rejects non-canonical tab whitespace in participant names'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values (repeat('N', 121), 'issue-26-long-name@example.test')$$,
  '23514', null,
  'the database rejects participant names over 120 characters'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values ('Mixed Case Email', 'Mixed.Case@example.test')$$,
  '23514', null,
  'the database requires an already-normalised lowercase email'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values ('Invalid Email', 'not-an-email')$$,
  '23514', null,
  'the database rejects an invalid email structure'
);

select throws_ok(
  $$insert into public.participants (full_name, email, student_id)
    values ('Blank Student ID', 'issue-26-blank-id@example.test', '')$$,
  '23514', null,
  'the database stores a blank student ID only as null'
);

select throws_ok(
  $$insert into public.participants (full_name, email, student_id)
    values (
      'Long Student ID', 'issue-26-long-id@example.test', repeat('S', 33)
    )$$,
  '23514', null,
  'the database rejects student IDs over 32 characters'
);

select throws_ok(
  $$insert into public.participants (full_name, email)
    values ('Duplicate Email', 'fictional.participant@example.test')$$,
  '23505', null,
  'normalised participant email remains globally unique'
);

select lives_ok(
  $$insert into public.participants (full_name, email, student_id)
    values (
      'Student Identity', 'issue-26-student@example.test', 'TEST-ISSUE-26'
    )$$,
  'an authorised user can store a bounded student ID when required'
);

select lives_ok(
  $$insert into public.registrations (event_id, participant_id)
    select 'c6400000-0000-4000-8000-000000000002', id
    from public.participants
    where email = 'issue-26-student@example.test'$$,
  'an event requiring identity accepts a participant with a student ID'
);

select throws_ok(
  $$insert into public.participants (full_name, email, student_id)
    values (
      'Duplicate Student Identity',
      'issue-26-duplicate-student@example.test',
      'TEST-ISSUE-26'
    )$$,
  '23505', null,
  'non-null student IDs remain globally unique'
);

select is(
  (select count(*)::integer from public.participants),
  3,
  'all rejected identity writes leave no incomplete participant rows'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claim.sub', '', true);

select throws_ok(
  $$select * from public.participants$$,
  '42501', null,
  'anonymous sessions cannot read participant identities directly'
);

reset role;

select * from finish();
rollback;
