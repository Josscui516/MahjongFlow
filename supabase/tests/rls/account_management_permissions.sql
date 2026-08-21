begin;

select plan(21);

insert into auth.users (
  instance_id, id, aud, role, email, confirmation_token, recovery_token,
  email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '00000000-0000-0000-0000-000000000000',
    'a1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'managed-target@example.test',
    '', '', '', '{}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a2222222-2222-4222-8222-222222222222',
    'authenticated', 'authenticated', 'managed-authorised@example.test',
    '', '', '', '{}', '{}', now(), now()
  );

select has_column('public', 'profiles', 'can_manage_accounts', 'profiles expose an independent account-admin capability');
select has_column('public', 'profiles', 'is_active', 'profiles expose an immediate application access switch');
select has_column('public', 'profiles', 'committee_position', 'profiles can record a minimal committee position');
select has_table('public', 'account_management_audit', 'account lifecycle changes have an append-only audit table');
select policies_are(
  'public',
  'account_management_audit',
  array['account_management_audit_admin_select'],
  'only account administrators receive an audit read policy'
);
select table_privs_are(
  'public',
  'account_management_audit',
  'authenticated',
  array['SELECT'],
  'authenticated users cannot write audit rows directly'
);
select function_privs_are(
  'public',
  'create_managed_profile',
  array['uuid', 'text', 'committee_role', 'text', 'boolean'],
  'anon',
  array[]::text[],
  'anonymous users cannot call the profile creation RPC'
);
select function_privs_are(
  'public',
  'create_managed_profile',
  array['uuid', 'text', 'committee_role', 'text', 'boolean'],
  'authenticated',
  array['EXECUTE'],
  'authenticated callers reach the internally authorised RPC'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);

select throws_ok(
  $$select public.create_managed_profile(
    'a1111111-1111-4111-8111-111111111111',
    'Managed Target',
    'committee',
    'Events Officer',
    false
  )$$,
  '42501',
  'account administration is not permitted',
  'ordinary committee users cannot create managed profiles'
);

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);

select lives_ok(
  $$select public.create_managed_profile(
    'a1111111-1111-4111-8111-111111111111',
    'Managed Target',
    'committee',
    'Events Officer',
    false
  )$$,
  'account administrators can create a profile for an existing Auth user'
);
select results_eq(
  $$select display_name, committee_position, can_manage_accounts, is_active
    from public.profiles
    where id = 'a1111111-1111-4111-8111-111111111111'$$,
  $$values ('Managed Target'::text, 'Events Officer'::text, false, true)$$,
  'managed profile fields are normalised and persisted'
);
select is(
  (
    select count(*)::integer
    from public.account_management_audit
    where target_profile_id = 'a1111111-1111-4111-8111-111111111111'
      and action = 'invited'
  ),
  1,
  'profile creation records exactly one invitation audit row'
);

select lives_ok(
  $$select public.create_managed_profile(
    'a2222222-2222-4222-8222-222222222222',
    'Managed Authorised',
    'authorised',
    'Assistant Secretary',
    false
  )$$,
  'account administrators can grant participant-data access independently'
);

select set_config(
  'request.jwt.claim.sub',
  'a2222222-2222-4222-8222-222222222222',
  true
);
select throws_ok(
  $$select public.update_managed_profile(
    'a1111111-1111-4111-8111-111111111111',
    'Forged Update',
    'committee',
    null,
    true
  )$$,
  '42501',
  'account administration is not permitted',
  'authorised participant-data access does not imply account administration'
);

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
select throws_ok(
  $$select public.update_managed_profile(
    '22222222-2222-4222-8222-222222222222',
    'Authorised Tester',
    'authorised',
    'Secretary',
    false
  )$$,
  '42501',
  'an account administrator cannot revoke their own access',
  'account administrators cannot revoke their own management access'
);
select throws_ok(
  $$select public.set_managed_profile_active(
    '22222222-2222-4222-8222-222222222222',
    false
  )$$,
  '42501',
  'an account administrator cannot disable their own account',
  'account administrators cannot disable themselves'
);
select lives_ok(
  $$select public.set_managed_profile_active(
    'a1111111-1111-4111-8111-111111111111',
    false
  )$$,
  'account administrators can disable another committee profile'
);
select is(
  (
    select is_active
    from public.profiles
    where id = 'a1111111-1111-4111-8111-111111111111'
  ),
  false,
  'disabled profile state is persisted'
);

select set_config(
  'request.jwt.claim.sub',
  'a1111111-1111-4111-8111-111111111111',
  true
);
select is(
  (select private.is_backend_user()),
  false,
  'an inactive profile is denied immediately even with an authenticated JWT'
);
select is(
  (select count(*)::integer from public.meetings),
  0,
  'RLS hides backend records from an inactive profile'
);

select set_config(
  'request.jwt.claim.sub',
  'a2222222-2222-4222-8222-222222222222',
  true
);
select is(
  (select count(*)::integer from public.account_management_audit),
  0,
  'non-admin authorised users cannot read account audit records'
);

select * from finish();
rollback;
