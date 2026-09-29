begin;

select plan(20);

-- 仅验证既有生产 RPC 到签到审计的数据库边界，不代表 #31 HTTP／页面联调。
-- 所有身份和活动均为本测试专属虚构数据；token 仅在事务内生成且不输出。
insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    '32200000-0000-4000-8000-000000000011',
    'authenticated', 'authenticated', 'issue32-provider-authorised@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '32200000-0000-4000-8000-000000000012',
    'authenticated', 'authenticated', 'issue32-provider-committee@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '32200000-0000-4000-8000-000000000013',
    'authenticated', 'authenticated', 'issue32-provider-no-profile@example.test',
    '', '', '', '{}', '{}', now(), now()
  );

insert into public.profiles (id, display_name, committee_role) values
  (
    '32200000-0000-4000-8000-000000000011',
    'Fictional Provider Audit Corrector', 'authorised'
  ),
  (
    '32200000-0000-4000-8000-000000000012',
    'Fictional Provider Audit Observer', 'committee'
  );

insert into public.events (
  id, event_type, name, starts_at, location, description,
  check_in_opens_at, check_in_closes_at, created_by
) values
  (
    '32200000-0000-4000-8000-000000000021',
    'weekly_session', 'Fictional QR Provider Event',
    statement_timestamp(), 'Fictional Provider Room',
    'Issue 32 production RPC audit fixture.',
    statement_timestamp() - interval '1 hour',
    statement_timestamp() + interval '1 hour',
    '32200000-0000-4000-8000-000000000011'
  ),
  (
    '32200000-0000-4000-8000-000000000022',
    'weekly_session', 'Fictional Other Provider Event',
    statement_timestamp(), 'Fictional Other Room',
    'Issue 32 event isolation fixture.',
    statement_timestamp() - interval '1 hour',
    statement_timestamp() + interval '1 hour',
    '32200000-0000-4000-8000-000000000011'
  );

insert into public.participants (id, full_name, email) values (
  '32200000-0000-4000-8000-000000000031',
  'Fictional QR Provider Attendee', 'issue32-provider-attendee@example.test'
);

insert into public.registrations (event_id, participant_id, recorded_by) values (
  '32200000-0000-4000-8000-000000000021',
  '32200000-0000-4000-8000-000000000031',
  '32200000-0000-4000-8000-000000000011'
);

do $$
begin
  perform set_config(
    'mahjongflow.issue32_provider_token',
    encode(extensions.gen_random_bytes(32), 'hex'),
    true
  );
end;
$$;

insert into public.event_check_in_tokens (event_id, token_digest, created_by)
values (
  '32200000-0000-4000-8000-000000000021',
  encode(
    extensions.digest(current_setting('mahjongflow.issue32_provider_token'), 'sha256'),
    'hex'
  ),
  '32200000-0000-4000-8000-000000000011'
);

set local role service_role;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'service_role';
set local request.jwt.claims = '{"role":"service_role"}';

do $$
begin
  perform set_config(
    'mahjongflow.issue32_provider_submitted_at', statement_timestamp()::text, true
  );
  perform set_config(
    'mahjongflow.issue32_provider_result',
    public.submit_event_check_in(
      current_setting('mahjongflow.issue32_provider_token'),
      'issue32-provider-attendee@example.test',
      null
    ),
    true
  );
end;
$$;

select is(
  current_setting('mahjongflow.issue32_provider_result'),
  'success',
  'production QR submission accepts the fictional registered participant'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '32200000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"32200000-0000-4000-8000-000000000011","role":"authenticated"}';

select is(
  (select count(*)::integer from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  1,
  'authorised reader can see the single production QR attendance record'
);

select is(
  (select row(event_id, participant_id, check_in_method::text,
              attendance_status::text, recorded_by is null)::text
   from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  '(32200000-0000-4000-8000-000000000021,32200000-0000-4000-8000-000000000031,qr,confirmed,t)',
  'QR provider fixes event and participant identity with confirmed QR and no recorder'
);

select results_eq(
  $$
    select e.name, p.full_name, p.email, recorder.display_name
    from public.attendance_records a
    join public.events e on e.id = a.event_id
    join public.participants p on p.id = a.participant_id
    left join public.profiles recorder on recorder.id = a.recorded_by
    where a.event_id = '32200000-0000-4000-8000-000000000021'
  $$,
  $$
    values ('Fictional QR Provider Event', 'Fictional QR Provider Attendee',
            'issue32-provider-attendee@example.test', null::text)
  $$,
  'authorised projection joins the real QR write to its event and minimum identity'
);

select is(
  (select checked_in_at from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  current_setting('mahjongflow.issue32_provider_submitted_at')::timestamptz,
  'QR check-in time is the trusted database submission statement time'
);

select ok(
  (select created_at = transaction_timestamp()
      and updated_at = transaction_timestamp()
   from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  'initial audit timestamps use database defaults rather than participant input'
);

select is(
  (select count(*)::integer from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000022'),
  0,
  'QR write leaves the other event without attendance'
);

do $$
begin
  perform set_config(
    'mahjongflow.issue32_provider_created_snapshot',
    (select to_jsonb(a)::text from public.attendance_records a
     where a.event_id = '32200000-0000-4000-8000-000000000021'),
    true
  );
end;
$$;

reset role;
set local role service_role;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'service_role';
set local request.jwt.claims = '{"role":"service_role"}';

select is(
  public.submit_event_check_in(
    current_setting('mahjongflow.issue32_provider_token'),
    'issue32-provider-attendee@example.test', null
  ),
  'already_processed',
  'duplicate production QR submission reports only the idempotent result'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '32200000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"32200000-0000-4000-8000-000000000011","role":"authenticated"}';

select ok(
  (select to_jsonb(a) =
      current_setting('mahjongflow.issue32_provider_created_snapshot')::jsonb
   from public.attendance_records a
   where a.event_id = '32200000-0000-4000-8000-000000000021'),
  'duplicate QR preserves the complete original attendance and audit metadata'
);

select is(
  (select count(*)::integer from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'
     and participant_id = '32200000-0000-4000-8000-000000000031'),
  1,
  'duplicate QR leaves exactly one event-participant row'
);

-- 调用既有 authorised 数据库更正路径，仅验证审计合同；不实现 #33 应用动作。
do $$
begin
  perform set_config(
    'mahjongflow.issue32_provider_corrected_at', statement_timestamp()::text, true
  );
  update public.attendance_records
  set attendance_status = 'voided'
  where event_id = '32200000-0000-4000-8000-000000000021'
    and participant_id = '32200000-0000-4000-8000-000000000031';
end;
$$;

select is(
  (select attendance_status::text from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  'voided',
  'authorised correction voids the real QR-created record'
);

select ok(
  (select a.check_in_method = 'qr'
      and a.recorded_by = '32200000-0000-4000-8000-000000000011'::uuid
      and (to_jsonb(a) - 'attendance_status' - 'recorded_by' - 'updated_at') =
        (current_setting('mahjongflow.issue32_provider_created_snapshot')::jsonb
          - 'attendance_status' - 'recorded_by' - 'updated_at')
   from public.attendance_records a
   where a.event_id = '32200000-0000-4000-8000-000000000021'),
  'correction records the current actor while retaining QR origin and original fields'
);

select ok(
  (select updated_at =
          current_setting('mahjongflow.issue32_provider_corrected_at')::timestamptz
      and updated_at >
          (current_setting('mahjongflow.issue32_provider_created_snapshot')::jsonb
            ->> 'updated_at')::timestamptz
   from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  'correction advances updated_at using the trusted database statement time'
);

do $$
begin
  perform set_config(
    'mahjongflow.issue32_provider_corrected_snapshot',
    (select to_jsonb(a)::text from public.attendance_records a
     where a.event_id = '32200000-0000-4000-8000-000000000021'),
    true
  );
end;
$$;

reset role;
set local role service_role;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'service_role';
set local request.jwt.claims = '{"role":"service_role"}';

select is(
  public.submit_event_check_in(
    current_setting('mahjongflow.issue32_provider_token'),
    'issue32-provider-attendee@example.test', null
  ),
  'already_processed',
  'QR retry after correction does not reveal or restore the voided status'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '32200000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"32200000-0000-4000-8000-000000000011","role":"authenticated"}';

select ok(
  (select to_jsonb(a) =
      current_setting('mahjongflow.issue32_provider_corrected_snapshot')::jsonb
   from public.attendance_records a
   where a.event_id = '32200000-0000-4000-8000-000000000021'),
  'QR retry preserves the complete correction including actor and timestamps'
);

select is(
  (select count(*)::integer from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  1,
  'corrected QR retry still leaves exactly one attendance row'
);

set local request.jwt.claim.sub = '32200000-0000-4000-8000-000000000012';
set local request.jwt.claims = '{"sub":"32200000-0000-4000-8000-000000000012","role":"authenticated"}';

select is(
  (select count(*)::integer from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  0,
  'committee reader cannot see the real QR-created audit record'
);

select is(
  (select count(*)::integer
   from public.attendance_records a
   join public.participants p on p.id = a.participant_id
   left join public.profiles recorder on recorder.id = a.recorded_by
   where a.event_id = '32200000-0000-4000-8000-000000000021'),
  0,
  'committee reader cannot reconstruct the QR audit projection through joins'
);

set local request.jwt.claim.sub = '32200000-0000-4000-8000-000000000013';
set local request.jwt.claims = '{"sub":"32200000-0000-4000-8000-000000000013","role":"authenticated"}';

select is(
  (select count(*)::integer from public.attendance_records
   where event_id = '32200000-0000-4000-8000-000000000021'),
  0,
  'authenticated identity without a profile cannot read QR audit metadata'
);

reset role;
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$select * from public.attendance_records
    where event_id = '32200000-0000-4000-8000-000000000021'$$,
  '42501', null,
  'anonymous participant cannot read attendance details after the restricted QR operation'
);

reset role;
select * from finish();

rollback;
