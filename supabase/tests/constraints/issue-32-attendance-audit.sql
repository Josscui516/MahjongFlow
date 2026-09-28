begin;

select plan(9);

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '32000000-0000-4000-8000-000000000011',
  'authenticated',
  'authenticated',
  'issue32-constraint-operator@example.test',
  '',
  '',
  '',
  '{}',
  '{}',
  now(),
  now()
);

insert into public.profiles (id, display_name, committee_role) values
  (
    '32000000-0000-4000-8000-000000000011',
    'Fictional Attendance Operator',
    'authorised'
  );

insert into public.events (
  id, event_type, name, starts_at, location, description, created_by
) values (
  '32000000-0000-4000-8000-000000000021',
  'weekly_session',
  'Fictional Attendance Audit Event',
  statement_timestamp(),
  'Fictional Room 32',
  'Issue 32 constraint fixture.',
  '32000000-0000-4000-8000-000000000011'
);

insert into public.participants (id, full_name, email) values
  (
    '32000000-0000-4000-8000-000000000031',
    'Fictional QR Attendee',
    'issue32-constraint-qr@example.test'
  ),
  (
    '32000000-0000-4000-8000-000000000032',
    'Fictional Manual Attendee',
    'issue32-constraint-manual@example.test'
  ),
  (
    '32000000-0000-4000-8000-000000000033',
    'Fictional Invalid Attendee',
    'issue32-constraint-invalid@example.test'
  );

insert into public.registrations (
  event_id, participant_id, recorded_by
) values (
  '32000000-0000-4000-8000-000000000021',
  '32000000-0000-4000-8000-000000000031',
  '32000000-0000-4000-8000-000000000011'
);

select lives_ok(
  $$
    insert into public.attendance_records (
      id, event_id, participant_id, check_in_method, recorded_by
    ) values (
      '32000000-0000-4000-8000-000000000041',
      '32000000-0000-4000-8000-000000000021',
      '32000000-0000-4000-8000-000000000031',
      'qr',
      null
    )
  $$,
  'QR attendance permits a null recorder'
);

select is(
  (
    select row(
      check_in_method::text,
      attendance_status::text,
      recorded_by is null
    )::text
    from public.attendance_records
    where id = '32000000-0000-4000-8000-000000000041'
  ),
  '(qr,confirmed,t)',
  'QR attendance keeps confirmed status and null recorder provenance'
);

select throws_ok(
  $$
    insert into public.attendance_records (
      event_id, participant_id, check_in_method, recorded_by
    ) values (
      '32000000-0000-4000-8000-000000000021',
      '32000000-0000-4000-8000-000000000033',
      'badge',
      '32000000-0000-4000-8000-000000000011'
    )
  $$,
  '22P02',
  null,
  'attendance rejects a method outside the QR and manual enum'
);

select throws_ok(
  $$
    insert into public.attendance_records (
      event_id, participant_id, check_in_method, recorded_by
    ) values (
      '32000000-0000-4000-8000-000000000021',
      '32000000-0000-4000-8000-000000000033',
      'manual',
      null
    )
  $$,
  '23514',
  null,
  'manual attendance rejects a missing recorder'
);

select throws_ok(
  $$
    insert into public.attendance_records (
      event_id, participant_id, check_in_method, attendance_status,
      recorded_by
    ) values (
      '32000000-0000-4000-8000-000000000021',
      '32000000-0000-4000-8000-000000000033',
      'qr',
      'voided',
      null
    )
  $$,
  '23514',
  null,
  'voided attendance rejects a missing recorder'
);

select lives_ok(
  $$
    insert into public.attendance_records (
      id, event_id, participant_id, checked_in_at, check_in_method,
      attendance_status, recorded_by, created_at, updated_at
    ) values (
      '32000000-0000-4000-8000-000000000042',
      '32000000-0000-4000-8000-000000000021',
      '32000000-0000-4000-8000-000000000032',
      '2000-01-01 10:00:00+11',
      'manual',
      'confirmed',
      '32000000-0000-4000-8000-000000000011',
      '2000-01-01 10:00:00+11',
      '2000-01-01 10:00:00+11'
    )
  $$,
  'manual attendance accepts a recorded operator'
);

select is(
  (
    select row(check_in_method::text, recorded_by)::text
    from public.attendance_records
    where id = '32000000-0000-4000-8000-000000000042'
  ),
  '(manual,32000000-0000-4000-8000-000000000011)',
  'manual attendance retains its recorded operator'
);

select lives_ok(
  $$
    update public.attendance_records
    set attendance_status = 'voided'
    where id = '32000000-0000-4000-8000-000000000042'
  $$,
  'attendance with a recorded operator can be voided'
);

select is(
  (
    select row(
      attendance_status::text,
      recorded_by,
      updated_at > created_at
    )::text
    from public.attendance_records
    where id = '32000000-0000-4000-8000-000000000042'
  ),
  '(voided,32000000-0000-4000-8000-000000000011,t)',
  'voiding preserves the operator and advances updated_at'
);

select * from finish();

rollback;
