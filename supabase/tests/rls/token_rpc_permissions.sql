begin;

select plan(28);

-- Keep the seeded fictional events inside a deterministic check-in window even
-- when the local database has been running longer than the seed's initial
-- two-hour window. The surrounding transaction rolls these values back.
update public.events
set
  check_in_opens_at = statement_timestamp() - interval '1 hour',
  check_in_closes_at = statement_timestamp() + interval '2 hours'
where id in (
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002'
);

do $$
begin
  perform set_config(
    'mahjongflow.test_token_valid',
    encode(extensions.gen_random_bytes(32), 'hex'),
    true
  );
  perform set_config(
    'mahjongflow.test_token_revoked',
    encode(extensions.gen_random_bytes(32), 'hex'),
    true
  );
  perform set_config(
    'mahjongflow.test_token_expired',
    encode(extensions.gen_random_bytes(32), 'hex'),
    true
  );
  perform set_config(
    'mahjongflow.test_token_student_id',
    encode(extensions.gen_random_bytes(32), 'hex'),
    true
  );
  perform set_config(
    'mahjongflow.test_token_unknown',
    encode(extensions.gen_random_bytes(32), 'hex'),
    true
  );
end;
$$;

insert into public.event_check_in_tokens (
  event_id,
  token_digest,
  created_by,
  revoked_at
) values
  (
    '40000000-0000-4000-8000-000000000001',
    encode(extensions.digest(current_setting('mahjongflow.test_token_valid'), 'sha256'), 'hex'),
    '22222222-2222-4222-8222-222222222222',
    null
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    encode(extensions.digest(current_setting('mahjongflow.test_token_student_id'), 'sha256'), 'hex'),
    '22222222-2222-4222-8222-222222222222',
    null
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    encode(extensions.digest(current_setting('mahjongflow.test_token_expired'), 'sha256'), 'hex'),
    '22222222-2222-4222-8222-222222222222',
    null
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    encode(extensions.digest(current_setting('mahjongflow.test_token_revoked'), 'sha256'), 'hex'),
    '22222222-2222-4222-8222-222222222222',
    statement_timestamp()
  );

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select throws_ok(
  $$select * from public.get_check_in_context(current_setting('mahjongflow.test_token_valid'))$$,
  '42501', null, 'authenticated browser cannot execute check-in context RPC'
);
select throws_ok(
  $$select public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'beta@example.test', null)$$,
  '42501', null, 'authenticated browser cannot execute check-in submission RPC'
);
select throws_ok(
  $$select * from public.rotate_event_check_in_token('40000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$$,
  '42501', null, 'authenticated browser cannot execute token rotation RPC'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select throws_ok(
  $$select * from public.get_check_in_context(current_setting('mahjongflow.test_token_valid'))$$,
  '42501', null, 'anonymous browser cannot execute check-in context RPC'
);
select throws_ok(
  $$select public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'beta@example.test', null)$$,
  '42501', null, 'anonymous browser cannot execute check-in submission RPC'
);
select throws_ok(
  $$select * from public.rotate_event_check_in_token('40000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222')$$,
  '42501', null, 'anonymous browser cannot execute token rotation RPC'
);

reset role;
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';

select is(
  (select result from public.get_check_in_context(current_setting('mahjongflow.test_token_valid'))),
  'available',
  'valid token returns an available context'
);
select is(
  (select row(event_name, location, window_status, student_id_required)::text from public.get_check_in_context(current_setting('mahjongflow.test_token_valid'))),
  '("Fictional Open Session","Test Room A",open,f)',
  'valid context exposes only the approved event fields'
);
select is(
  (select result from public.get_check_in_context(current_setting('mahjongflow.test_token_unknown'))),
  'unavailable',
  'unknown token returns the uniform unavailable result'
);
select is(
  (select result from public.get_check_in_context(current_setting('mahjongflow.test_token_revoked'))),
  'unavailable',
  'revoked token returns the uniform unavailable result'
);
select is(
  (select result from public.get_check_in_context(current_setting('mahjongflow.test_token_expired'))),
  'unavailable',
  'expired-window token returns the uniform unavailable result'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'unknown@example.test', null),
  'unable_to_process',
  'unknown participant returns a non-enumerating failure'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), repeat('a', 255), null),
  'unable_to_process',
  'oversized email input is rejected before participant lookup'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'beta@example.test', repeat('1', 33)),
  'unable_to_process',
  'oversized student ID input is rejected before participant lookup'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'epsilon@example.test', 'TEST-0001'),
  'unable_to_process',
  'a participant registered to another event cannot cross the token boundary'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_student_id'), 'epsilon@example.test', 'WRONG-ID'),
  'unable_to_process',
  'student ID mismatch returns a non-enumerating failure'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_student_id'), 'epsilon@example.test', 'TEST-0001'),
  'already_processed',
  'an existing voided attendance remains already processed'
);
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'beta@example.test', null),
  'success',
  'valid registered participant can check in once'
);
reset role;
select is(
  (select row(check_in_method::text, attendance_status::text, recorded_by is null)::text
   from public.attendance_records
   where event_id = '40000000-0000-4000-8000-000000000001'
     and participant_id = '60000000-0000-4000-8000-000000000002'),
  '(qr,confirmed,t)',
  'successful token check-in stores trusted QR provenance only'
);
set local role service_role;
select is(
  public.submit_event_check_in(current_setting('mahjongflow.test_token_valid'), 'beta@example.test', null),
  'already_processed',
  'repeat token submission is idempotent'
);
reset role;
select is(
  (select count(*)::integer
   from public.attendance_records
   where event_id = '40000000-0000-4000-8000-000000000001'
     and participant_id = '60000000-0000-4000-8000-000000000002'),
  1,
  'repeat submission leaves exactly one attendance row'
);
set local role service_role;
select throws_ok(
  $$select * from public.rotate_event_check_in_token('40000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111')$$,
  '42501', 'resource unavailable', 'committee actor cannot rotate a token'
);

create temporary table rotated_token on commit drop as
select *
from public.rotate_event_check_in_token(
  '40000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222'
);

reset role;
select matches(
  (select token from rotated_token),
  '^[0-9a-f]{64}$',
  'rotation returns one high-entropy token-shaped value'
);
select is(
  (select count(*)::integer from public.event_check_in_tokens where event_id = '40000000-0000-4000-8000-000000000002' and revoked_at is null),
  1,
  'rotation leaves exactly one active token'
);
select ok(
  (select not exists (
    select 1
    from public.event_check_in_tokens
    where token_digest = rotated_token.token
  ) from rotated_token),
  'plaintext rotated token is never stored'
);
select ok(
  (select exists (
    select 1
    from public.event_check_in_tokens
    where token_digest = encode(extensions.digest(rotated_token.token, 'sha256'), 'hex')
      and created_by = '22222222-2222-4222-8222-222222222222'
  ) from rotated_token),
  'rotation stores only the digest and authorised actor'
);
set local role service_role;
select is(
  (select result from public.get_check_in_context(current_setting('mahjongflow.test_token_student_id'))),
  'unavailable',
  'rotated old token is immediately unavailable'
);
select is(
  (select context.result
   from rotated_token
   cross join lateral public.get_check_in_context(rotated_token.token) context),
  'available',
  'new token becomes the only available context'
);

reset role;

delete from public.event_check_in_tokens
where token_digest in (
  encode(extensions.digest(current_setting('mahjongflow.test_token_valid'), 'sha256'), 'hex'),
  encode(extensions.digest(current_setting('mahjongflow.test_token_revoked'), 'sha256'), 'hex'),
  encode(extensions.digest(current_setting('mahjongflow.test_token_expired'), 'sha256'), 'hex'),
  encode(extensions.digest(current_setting('mahjongflow.test_token_student_id'), 'sha256'), 'hex')
);

select * from finish();
rollback;
