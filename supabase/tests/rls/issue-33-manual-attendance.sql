begin;

select plan(27);

-- #33：只使用事务内虚构数据，复用现有 RLS、列授权、唯一约束和可信审计触发器。
insert into auth.users (id, email) values
  ('33300000-0000-4000-8000-000000000011', 'issue33-authorised@example.test'),
  ('33300000-0000-4000-8000-000000000012', 'issue33-corrector@example.test'),
  ('33300000-0000-4000-8000-000000000013', 'issue33-committee@example.test'),
  ('33300000-0000-4000-8000-000000000014', 'issue33-no-profile@example.test');
insert into public.profiles (id, display_name, committee_role) values
  ('33300000-0000-4000-8000-000000000011', 'Fictional Manual Operator', 'authorised'),
  ('33300000-0000-4000-8000-000000000012', 'Fictional Second Operator', 'authorised'),
  ('33300000-0000-4000-8000-000000000013', 'Fictional Manual Observer', 'committee');
insert into public.events (id, event_type, name, starts_at, location, description, created_by) values
  ('33300000-0000-4000-8000-000000000021', 'weekly_session', 'Fictional Manual Event', now(), 'Fictional Room', 'Issue 33 fixture', '33300000-0000-4000-8000-000000000011'),
  ('33300000-0000-4000-8000-000000000022', 'weekly_session', 'Fictional Other Event', now(), 'Fictional Room', 'Issue 33 event isolation', '33300000-0000-4000-8000-000000000011');
insert into public.participants (id, full_name, email) values
  ('33300000-0000-4000-8000-000000000031', 'Fictional Walk In', 'issue33-walk-in@example.test'),
  ('33300000-0000-4000-8000-000000000032', 'Fictional QR Attendee', 'issue33-qr@example.test');
insert into public.registrations (event_id, participant_id, recorded_by) values
  ('33300000-0000-4000-8000-000000000021', '33300000-0000-4000-8000-000000000032', '33300000-0000-4000-8000-000000000011');
insert into public.attendance_records (event_id, participant_id, check_in_method, checked_in_at) values
  ('33300000-0000-4000-8000-000000000021', '33300000-0000-4000-8000-000000000032', 'qr', '2026-09-28T01:00:00Z');

set local role authenticated;
set local request.jwt.claim.sub = '33300000-0000-4000-8000-000000000011';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"33300000-0000-4000-8000-000000000011","role":"authenticated"}';

do $$
begin
  perform set_config('mahjongflow.issue33_manual_time', statement_timestamp()::text, true);
  insert into public.attendance_records (event_id, participant_id) values
    ('33300000-0000-4000-8000-000000000021', '33300000-0000-4000-8000-000000000031');
end;
$$;
select ok(
  (select check_in_method = 'manual' and attendance_status = 'confirmed'
     and recorded_by = '33300000-0000-4000-8000-000000000011'
     and checked_in_at = current_setting('mahjongflow.issue33_manual_time')::timestamptz
   from public.attendance_records where participant_id = '33300000-0000-4000-8000-000000000031'),
  'K-06: manual insert uses current actor, database time and confirmed manual provenance'
);
select is((select count(*)::integer from public.registrations where participant_id = '33300000-0000-4000-8000-000000000031'), 0,
  'unregistered manual exception creates no implicit registration');
select throws_ok($$insert into public.attendance_records (event_id, participant_id) values ('33300000-0000-4000-8000-000000000021', '33300000-0000-4000-8000-000000000031')$$,
  '23505', null, 'K-04: repeated manual create cannot insert a second row');
select is((select count(*)::integer from public.attendance_records where event_id = '33300000-0000-4000-8000-000000000021' and participant_id = '33300000-0000-4000-8000-000000000031'), 1,
  'duplicate manual submission leaves one row');
select throws_ok($$insert into public.attendance_records (event_id, participant_id, recorded_by) values ('33300000-0000-4000-8000-000000000022', '33300000-0000-4000-8000-000000000031', '33300000-0000-4000-8000-000000000012')$$,
  '42501', null, 'column grants reject a forged manual creator');
select throws_ok($$insert into public.attendance_records (event_id, participant_id, checked_in_at) values ('33300000-0000-4000-8000-000000000022', '33300000-0000-4000-8000-000000000031', '2000-01-01')$$,
  '42501', null, 'column grants reject a client-supplied check-in time');
select throws_ok($$insert into public.attendance_records (event_id, participant_id, check_in_method) values ('33300000-0000-4000-8000-000000000022', '33300000-0000-4000-8000-000000000031', 'qr')$$,
  '42501', null, 'authenticated manual create cannot impersonate QR');

do $$
begin
  perform set_config('mahjongflow.issue33_original_qr',
    (select to_jsonb(a)::text from public.attendance_records a where participant_id = '33300000-0000-4000-8000-000000000032'), true);
  perform set_config('mahjongflow.issue33_void_time', statement_timestamp()::text, true);
  update public.attendance_records set attendance_status = 'voided'
    where event_id = '33300000-0000-4000-8000-000000000021'
      and participant_id = '33300000-0000-4000-8000-000000000032'
      and attendance_status = 'confirmed'
      and updated_at = (current_setting('mahjongflow.issue33_original_qr')::jsonb ->> 'updated_at')::timestamptz;
end;
$$;
select ok((select attendance_status = 'voided' and recorded_by = '33300000-0000-4000-8000-000000000011'
  and updated_at = current_setting('mahjongflow.issue33_void_time')::timestamptz
  from public.attendance_records where participant_id = '33300000-0000-4000-8000-000000000032'),
  'K-06: authorised void saves current actor and trusted update time');
select ok((select to_jsonb(a) - array['attendance_status', 'recorded_by', 'updated_at'] =
  current_setting('mahjongflow.issue33_original_qr')::jsonb - array['attendance_status', 'recorded_by', 'updated_at']
  from public.attendance_records a where participant_id = '33300000-0000-4000-8000-000000000032'),
  'QR void preserves every original identity and provenance field');
select results_eq($$with changed as (update public.attendance_records set attendance_status = 'confirmed'
  where event_id = '33300000-0000-4000-8000-000000000021' and participant_id = '33300000-0000-4000-8000-000000000032'
  and updated_at = (current_setting('mahjongflow.issue33_original_qr')::jsonb ->> 'updated_at')::timestamptz returning id)
  select count(*)::integer from changed$$, $$values (0)$$, 'stale CAS version changes no row');
select results_eq($$with changed as (update public.attendance_records set attendance_status = 'confirmed'
  where event_id = '33300000-0000-4000-8000-000000000022' and participant_id = '33300000-0000-4000-8000-000000000032' returning id)
  select count(*)::integer from changed$$, $$values (0)$$, 'wrong event scope changes no row');

set local request.jwt.claim.sub = '33300000-0000-4000-8000-000000000012';
set local request.jwt.claims = '{"sub":"33300000-0000-4000-8000-000000000012","role":"authenticated"}';
do $$
begin
  perform set_config('mahjongflow.issue33_restore_time', statement_timestamp()::text, true);
  update public.attendance_records set attendance_status = 'confirmed'
  where event_id = '33300000-0000-4000-8000-000000000021' and participant_id = '33300000-0000-4000-8000-000000000032'
    and attendance_status = 'voided' and updated_at = current_setting('mahjongflow.issue33_void_time')::timestamptz;
end;
$$;
select ok((select attendance_status = 'confirmed' and recorded_by = '33300000-0000-4000-8000-000000000012'
  and updated_at = current_setting('mahjongflow.issue33_restore_time')::timestamptz
  from public.attendance_records where participant_id = '33300000-0000-4000-8000-000000000032'),
  'restore attributes the second current operator and its update time');
select ok((select to_jsonb(a) - array['attendance_status', 'recorded_by', 'updated_at'] =
  current_setting('mahjongflow.issue33_original_qr')::jsonb - array['attendance_status', 'recorded_by', 'updated_at']
  from public.attendance_records a where participant_id = '33300000-0000-4000-8000-000000000032'),
  'restore retains QR method, original check-in time and creation metadata');
do $$
begin
  perform set_config('mahjongflow.issue33_restored',
    (select to_jsonb(a)::text from public.attendance_records a where participant_id = '33300000-0000-4000-8000-000000000032'), true);
end;
$$;
select throws_ok($$update public.attendance_records set attendance_status = 'invalid' where participant_id = '33300000-0000-4000-8000-000000000032'$$,
  '22P02', null, 'invalid correction status is rejected');
select throws_ok($$update public.attendance_records set recorded_by = '33300000-0000-4000-8000-000000000011' where participant_id = '33300000-0000-4000-8000-000000000032'$$,
  '42501', null, 'client cannot forge correction actor');
select throws_ok($$update public.attendance_records set check_in_method = 'manual' where participant_id = '33300000-0000-4000-8000-000000000032'$$,
  '42501', null, 'client cannot overwrite QR provenance');
select throws_ok($$delete from public.attendance_records where participant_id = '33300000-0000-4000-8000-000000000032'$$,
  '42501', null, 'correction cannot delete attendance history');
select ok((select to_jsonb(a) = current_setting('mahjongflow.issue33_restored')::jsonb
  from public.attendance_records a where participant_id = '33300000-0000-4000-8000-000000000032'),
  'all failed correction attempts leave the entire previous record unchanged');

set local request.jwt.claim.sub = '33300000-0000-4000-8000-000000000013';
set local request.jwt.claims = '{"sub":"33300000-0000-4000-8000-000000000013","role":"authenticated"}';
select throws_ok($$insert into public.attendance_records (event_id, participant_id) values ('33300000-0000-4000-8000-000000000022', '33300000-0000-4000-8000-000000000031')$$,
  '42501', null, 'committee cannot create manual attendance');
select results_eq($$with changed as (update public.attendance_records set attendance_status = 'voided'
  where participant_id = '33300000-0000-4000-8000-000000000032' returning id) select count(*)::integer from changed$$, $$values (0)$$,
  'committee correction is filtered by RLS');
set local request.jwt.claim.sub = '33300000-0000-4000-8000-000000000014';
set local request.jwt.claims = '{"sub":"33300000-0000-4000-8000-000000000014","role":"authenticated"}';
select throws_ok($$insert into public.attendance_records (event_id, participant_id) values ('33300000-0000-4000-8000-000000000022', '33300000-0000-4000-8000-000000000031')$$,
  '42501', null, 'session without a profile cannot create manual attendance');
select results_eq($$with changed as (update public.attendance_records set attendance_status = 'voided'
  where participant_id = '33300000-0000-4000-8000-000000000032' returning id) select count(*)::integer from changed$$, $$values (0)$$,
  'session without a profile cannot correct attendance');
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$insert into public.attendance_records (event_id, participant_id) values ('33300000-0000-4000-8000-000000000022', '33300000-0000-4000-8000-000000000031')$$,
  '42501', null, 'anonymous participant cannot call manual insert directly');
select throws_ok($$update public.attendance_records set attendance_status = 'voided' where participant_id = '33300000-0000-4000-8000-000000000032'$$,
  '42501', null, 'anonymous participant cannot call correction directly');
reset role;
select ok((select to_jsonb(a) = current_setting('mahjongflow.issue33_restored')::jsonb
  from public.attendance_records a where participant_id = '33300000-0000-4000-8000-000000000032'),
  'denied corrections leave the complete original record unchanged');
select is((select count(*)::integer from public.attendance_records where event_id = '33300000-0000-4000-8000-000000000022'), 0,
  'denied and forged manual inserts create no attendance');
select is((select count(*)::integer from public.registrations where event_id = '33300000-0000-4000-8000-000000000021'), 1,
  'manual changes preserve the separate registration facts');

select * from finish();
rollback;
