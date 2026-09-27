begin;
select plan(9);

select has_function(
  'public',
  'consume_check_in_rate_limit',
  array['text', 'integer', 'integer'],
  'deployment-wide check-in limiter exists'
);
select function_privs_are(
  'public',
  'consume_check_in_rate_limit',
  array['text', 'integer', 'integer'],
  'anon',
  array[]::text[],
  'anonymous clients cannot call the limiter'
);
select function_privs_are(
  'public',
  'consume_check_in_rate_limit',
  array['text', 'integer', 'integer'],
  'authenticated',
  array[]::text[],
  'authenticated browsers cannot call the limiter'
);
select function_privs_are(
  'public',
  'consume_check_in_rate_limit',
  array['text', 'integer', 'integer'],
  'service_role',
  array['EXECUTE'],
  'the trusted server can call the limiter'
);

set local role service_role;
select ok(public.consume_check_in_rate_limit(repeat('a', 64), 2, 60), 'first attempt is allowed');
select ok(public.consume_check_in_rate_limit(repeat('a', 64), 2, 60), 'second attempt is allowed');
select is(public.consume_check_in_rate_limit(repeat('a', 64), 2, 60), false, 'limit is enforced atomically');
select is(public.consume_check_in_rate_limit('raw-ip-address', 2, 60), false, 'raw identifiers are rejected');
reset role;
select is(
  (select count(*)::integer from private.check_in_rate_limits where fingerprint = repeat('a', 64)),
  1,
  'one shared counter row is retained'
);

select * from finish();
rollback;
