begin;
select plan(19);

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '30000000-0000-4000-8000-000000000030',
  'authenticated', 'authenticated', 'issue30-committee@example.test',
  '', '', '', '{}', '{}', now(), now()
);
insert into public.profiles (id, display_name, committee_role)
values ('30000000-0000-4000-8000-000000000030', 'Fictional Issue 30 Committee', 'committee');

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';
select throws_ok($$select * from public.get_event_check_in_token_status('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')$$, '42501', null, 'authenticated browser cannot read token-management metadata');
select throws_ok($$select * from public.configure_event_check_in_window('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222',now(),now()+interval '1 hour')$$, '42501', null, 'authenticated browser cannot call the window-management RPC');
select throws_ok($$select public.revoke_event_check_in_token('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')$$, '42501', null, 'authenticated browser cannot revoke a token');

set local request.jwt.claims = '{"sub":"30000000-0000-4000-8000-000000000030","role":"authenticated"}';
select throws_ok($$update public.events set check_in_opens_at=now(),check_in_closes_at=now()+interval '1 hour' where id='40000000-0000-4000-8000-000000000001'$$, '42501', 'resource unavailable', 'committee cannot bypass the server to change protected window columns');

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok($$select * from public.get_event_check_in_token_status('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')$$, '42501', null, 'anonymous browser cannot read token-management metadata');
select throws_ok($$select public.revoke_event_check_in_token('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')$$, '42501', null, 'anonymous browser cannot revoke a token');

reset role;
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select throws_ok($$select * from public.configure_event_check_in_window('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000030',now(),now()+interval '1 hour')$$, '42501', 'resource unavailable', 'committee actor cannot configure the check-in window');
select throws_ok($$select * from public.configure_event_check_in_window('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222',now()+interval '1 hour',now())$$, '22023', 'invalid check-in window', 'reversed check-in window is rejected');
select lives_ok($$select * from public.configure_event_check_in_window('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222',now()-interval '1 hour',now()+interval '2 hours')$$, 'authorised actor can configure a valid window');
reset role;
select ok((select check_in_opens_at < statement_timestamp() and check_in_closes_at > statement_timestamp() from public.events where id='40000000-0000-4000-8000-000000000001'), 'configured window persists on the selected event only');
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';

create temporary table issue30_token on commit drop as
select * from public.rotate_event_check_in_token('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222');
select matches((select token from issue30_token), '^[0-9a-f]{64}$', 'rotation returns 32 random bytes as hex');
reset role;
select is((select count(*)::integer from public.event_check_in_tokens where event_id='40000000-0000-4000-8000-000000000001' and revoked_at is null), 1, 'exactly one active token exists after rotation');
select ok((select not exists(select 1 from public.event_check_in_tokens where token_digest=issue30_token.token) from issue30_token), 'plaintext token is not stored');
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select ok((select active from public.get_event_check_in_token_status('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')), 'status reports an active token without returning its digest');
select is((select result from issue30_token cross join lateral public.get_check_in_context(issue30_token.token)), 'available', 'generated token resolves to the bound scheduled event during its window');
select lives_ok($$select public.revoke_event_check_in_token('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')$$, 'authorised actor can revoke the active token');
reset role;
select is((select count(*)::integer from public.event_check_in_tokens where event_id='40000000-0000-4000-8000-000000000001' and revoked_at is null), 0, 'revocation leaves no active token');
set local role service_role;
set local request.jwt.claims = '{"role":"service_role"}';
select is((select result from issue30_token cross join lateral public.get_check_in_context(issue30_token.token)), 'unavailable', 'revoked token immediately returns the uniform unavailable result');
select ok(not (select active from public.get_event_check_in_token_status('40000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222')), 'non-secret status reports the revoked state');

reset role;
select * from finish();
rollback;
