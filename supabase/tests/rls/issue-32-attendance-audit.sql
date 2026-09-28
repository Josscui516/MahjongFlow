begin;

select plan(14);

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '32100000-0000-4000-8000-000000000011',
    'authenticated',
    'authenticated',
    'issue32-authorised@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '32100000-0000-4000-8000-000000000012',
    'authenticated',
    'authenticated',
    'issue32-corrector@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '32100000-0000-4000-8000-000000000013',
    'authenticated',
    'authenticated',
    'issue32-committee@example.test',
    '', '', '', '{}', '{}', now(), now()
  );

insert into public.profiles (id, display_name, committee_role) values
  (
    '32100000-0000-4000-8000-000000000011',
    'Fictional Attendance Operator',
    'authorised'
  ),
  (
    '32100000-0000-4000-8000-000000000012',
    'Fictional Attendance Corrector',
    'authorised'
  ),
  (
    '32100000-0000-4000-8000-000000000013',
    'Fictional Committee Observer',
    'committee'
  );

insert into public.events (
  id, event_type, name, starts_at, location, description, created_by
) values
  (
    '32100000-0000-4000-8000-000000000021',
    'weekly_session',
    'Fictional Audit Event Alpha',
    statement_timestamp(),
    'Fictional Room Alpha',
    'Issue 32 first event fixture.',
    '32100000-0000-4000-8000-000000000011'
  ),
  (
    '32100000-0000-4000-8000-000000000022',
    'tournament',
    'Fictional Audit Event Beta',
    statement_timestamp() + interval '1 day',
    'Fictional Room Beta',
    'Issue 32 second event fixture.',
    '32100000-0000-4000-8000-000000000011'
  );

insert into public.participants (id, full_name, email) values
  (
    '32100000-0000-4000-8000-000000000031',
    'Fictional Alpha QR Attendee',
    'issue32-alpha-qr@example.test'
  ),
  (
    '32100000-0000-4000-8000-000000000032',
    'Fictional Alpha Manual Attendee',
    'issue32-alpha-manual@example.test'
  ),
  (
    '32100000-0000-4000-8000-000000000033',
    'Fictional Beta QR Attendee',
    'issue32-beta-qr@example.test'
  ),
  (
    '32100000-0000-4000-8000-000000000034',
    'Fictional Forgery Probe',
    'issue32-forgery-probe@example.test'
  );

insert into public.registrations (
  event_id, participant_id, recorded_by
) values
  (
    '32100000-0000-4000-8000-000000000021',
    '32100000-0000-4000-8000-000000000031',
    '32100000-0000-4000-8000-000000000011'
  ),
  (
    '32100000-0000-4000-8000-000000000022',
    '32100000-0000-4000-8000-000000000033',
    '32100000-0000-4000-8000-000000000011'
  );

insert into public.attendance_records (
  id, event_id, participant_id, check_in_method, recorded_by
) values
  (
    '32100000-0000-4000-8000-000000000041',
    '32100000-0000-4000-8000-000000000021',
    '32100000-0000-4000-8000-000000000031',
    'qr',
    null
  ),
  (
    '32100000-0000-4000-8000-000000000043',
    '32100000-0000-4000-8000-000000000022',
    '32100000-0000-4000-8000-000000000033',
    'qr',
    null
  );

set local role authenticated;
set local request.jwt.claim.sub = '32100000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
select set_config(
  'request.jwt.claims',
  '{"sub":"32100000-0000-4000-8000-000000000011","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    insert into public.attendance_records (event_id, participant_id)
    values (
      '32100000-0000-4000-8000-000000000021',
      '32100000-0000-4000-8000-000000000032'
    )
  $$,
  'authorised operator can record manual attendance through trusted fields'
);

select is(
  (
    select row(
      check_in_method::text,
      attendance_status::text,
      recorded_by
    )::text
    from public.attendance_records
    where event_id = '32100000-0000-4000-8000-000000000021'
      and participant_id = '32100000-0000-4000-8000-000000000032'
  ),
  '(manual,confirmed,32100000-0000-4000-8000-000000000011)',
  'manual provenance is derived from the current authorised operator'
);

select throws_ok(
  $$
    insert into public.attendance_records (
      event_id, participant_id, recorded_by
    ) values (
      '32100000-0000-4000-8000-000000000021',
      '32100000-0000-4000-8000-000000000034',
      '32100000-0000-4000-8000-000000000012'
    )
  $$,
  '42501',
  null,
  'authorised browser cannot forge a manual recorder'
);

set local request.jwt.claim.sub = '32100000-0000-4000-8000-000000000012';
select set_config(
  'request.jwt.claims',
  '{"sub":"32100000-0000-4000-8000-000000000012","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    update public.attendance_records
    set attendance_status = 'voided'
    where id = '32100000-0000-4000-8000-000000000041'
  $$,
  'an authorised corrector can void a QR attendance record'
);

select is(
  (
    select row(
      check_in_method::text,
      attendance_status::text,
      recorded_by,
      updated_at > created_at
    )::text
    from public.attendance_records
    where id = '32100000-0000-4000-8000-000000000041'
  ),
  '(qr,voided,32100000-0000-4000-8000-000000000012,t)',
  'correcting QR attendance retains its method and records the corrector'
);

select lives_ok(
  $$
    update public.attendance_records
    set attendance_status = 'voided'
    where event_id = '32100000-0000-4000-8000-000000000021'
      and participant_id = '32100000-0000-4000-8000-000000000032'
  $$,
  'a second authorised operator can void attendance'
);

select is(
  (
    select row(
      check_in_method::text,
      attendance_status::text,
      recorded_by,
      updated_at > created_at
    )::text
    from public.attendance_records
    where event_id = '32100000-0000-4000-8000-000000000021'
      and participant_id = '32100000-0000-4000-8000-000000000032'
  ),
  '(manual,voided,32100000-0000-4000-8000-000000000012,t)',
  'voiding records the current corrector and advances updated_at'
);

select is(
  (
    select count(*)::integer
    from public.attendance_records
    where event_id in (
      '32100000-0000-4000-8000-000000000021',
      '32100000-0000-4000-8000-000000000022'
    )
  ),
  3,
  'authorised reader can access all three Issue 32 audit records'
);

select is(
  (
    select count(*)::integer
    from public.attendance_records
    where event_id = '32100000-0000-4000-8000-000000000021'
  ),
  2,
  'event-scoped read returns only the two Alpha records'
);

select is(
  (
    select count(*)::integer
    from public.attendance_records
    where event_id = '32100000-0000-4000-8000-000000000022'
  ),
  1,
  'event-scoped read keeps the Beta record isolated'
);

select results_eq(
  $$
    select
      p.full_name,
      a.check_in_method::text,
      a.attendance_status::text,
      coalesce(recorder.display_name, 'QR self-service')
    from public.attendance_records a
    join public.participants p on p.id = a.participant_id
    left join public.profiles recorder on recorder.id = a.recorded_by
    where a.event_id = '32100000-0000-4000-8000-000000000021'
    order by p.full_name
  $$,
  $$
    values
      ('Fictional Alpha Manual Attendee', 'manual', 'voided',
       'Fictional Attendance Corrector'),
      ('Fictional Alpha QR Attendee', 'qr', 'voided',
       'Fictional Attendance Corrector')
  $$,
  'authorised audit projection exposes QR and manual provenance for one event'
);

set local request.jwt.claim.sub = '32100000-0000-4000-8000-000000000013';
select set_config(
  'request.jwt.claims',
  '{"sub":"32100000-0000-4000-8000-000000000013","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.attendance_records),
  0,
  'committee user receives no attendance audit rows'
);

select is(
  (
    select count(*)::integer
    from public.attendance_records a
    join public.participants p on p.id = a.participant_id
    left join public.profiles recorder on recorder.id = a.recorded_by
  ),
  0,
  'committee user cannot assemble an attendance audit DTO through joins'
);

reset role;
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok(
  $$select * from public.attendance_records$$,
  '42501',
  null,
  'anonymous user cannot read attendance audit records'
);

reset role;

select * from finish();

rollback;
