-- Adds application-managed committee account lifecycle controls without
-- conflating participant-data access with account administration.

create type public.account_management_action as enum (
  'invited',
  'profile_updated',
  'disabled',
  'reactivated',
  'recovery_sent'
);

alter table public.profiles
  add column committee_position text,
  add column can_manage_accounts boolean not null default false,
  add column is_active boolean not null default true,
  add constraint profiles_committee_position_check check (
    committee_position is null
    or (
      committee_position = btrim(committee_position)
      and char_length(committee_position) between 1 and 80
    )
  );

-- Bootstrap one existing authorised profile so the first deployment can use
-- the in-app management flow. Subsequent grants are made through the guarded
-- RPC below and are audited.
update public.profiles
set can_manage_accounts = true
where id = (
  select id
  from public.profiles
  where committee_role = 'authorised'::public.committee_role
  order by created_at, id
  limit 1
);

create table public.account_management_audit (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  target_profile_id uuid not null references public.profiles(id) on delete restrict,
  action public.account_management_action not null,
  previous_role public.committee_role,
  new_role public.committee_role,
  previous_can_manage_accounts boolean,
  new_can_manage_accounts boolean,
  previous_is_active boolean,
  new_is_active boolean,
  created_at timestamptz not null default now()
);

create index account_management_audit_actor_idx
  on public.account_management_audit (actor_profile_id, created_at desc);
create index account_management_audit_target_idx
  on public.account_management_audit (target_profile_id, created_at desc);
create index profiles_active_directory_idx
  on public.profiles (is_active, display_name, id);

alter table public.account_management_audit enable row level security;

revoke all on table public.account_management_audit from public, anon, authenticated;
grant select on table public.account_management_audit to authenticated;

create or replace function private.is_backend_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active
      and committee_role in (
        'committee'::public.committee_role,
        'authorised'::public.committee_role
      )
  );
$$;

create or replace function private.is_authorised()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active
      and committee_role = 'authorised'::public.committee_role
  );
$$;

create or replace function private.is_account_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active
      and can_manage_accounts
      and committee_role in (
        'committee'::public.committee_role,
        'authorised'::public.committee_role
      )
  );
$$;

revoke execute on function private.is_account_admin() from public, anon;
grant execute on function private.is_account_admin() to authenticated;

create policy account_management_audit_admin_select
  on public.account_management_audit
  for select to authenticated
  using ((select private.is_account_admin()));

create or replace function private.assert_account_admin()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not (select private.is_account_admin()) then
    raise exception 'account administration is not permitted'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function private.has_other_active_account_admin(
  excluded_profile_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id <> excluded_profile_id
      and is_active
      and can_manage_accounts
  );
$$;

revoke execute on function private.assert_account_admin() from public, anon, authenticated;
revoke execute on function private.has_other_active_account_admin(uuid)
  from public, anon, authenticated;

create or replace function public.create_managed_profile(
  target_profile_id uuid,
  target_display_name text,
  target_role public.committee_role,
  target_committee_position text default null,
  target_can_manage_accounts boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalised_name text := btrim(target_display_name);
  normalised_position text := nullif(btrim(target_committee_position), '');
begin
  perform private.assert_account_admin();

  if target_profile_id is null
    or char_length(normalised_name) not between 1 and 120
    or (
      normalised_position is not null
      and char_length(normalised_position) not between 1 and 80
    ) then
    raise exception 'invalid managed profile input' using errcode = '22023';
  end if;

  insert into public.profiles (
    id,
    display_name,
    committee_role,
    committee_position,
    can_manage_accounts,
    is_active
  ) values (
    target_profile_id,
    normalised_name,
    target_role,
    normalised_position,
    target_can_manage_accounts,
    true
  );

  insert into public.account_management_audit (
    actor_profile_id,
    target_profile_id,
    action,
    new_role,
    new_can_manage_accounts,
    new_is_active
  ) values (
    auth.uid(),
    target_profile_id,
    'invited',
    target_role,
    target_can_manage_accounts,
    true
  );
end;
$$;

create or replace function public.update_managed_profile(
  target_profile_id uuid,
  target_display_name text,
  target_role public.committee_role,
  target_committee_position text default null,
  target_can_manage_accounts boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
  normalised_name text := btrim(target_display_name);
  normalised_position text := nullif(btrim(target_committee_position), '');
begin
  perform private.assert_account_admin();

  select * into current_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'managed profile is unavailable' using errcode = 'P0002';
  end if;

  if char_length(normalised_name) not between 1 and 120
    or (
      normalised_position is not null
      and char_length(normalised_position) not between 1 and 80
    ) then
    raise exception 'invalid managed profile input' using errcode = '22023';
  end if;

  if target_profile_id = auth.uid()
    and current_profile.can_manage_accounts
    and not target_can_manage_accounts then
    raise exception 'an account administrator cannot revoke their own access'
      using errcode = '42501';
  end if;

  if current_profile.is_active
    and current_profile.can_manage_accounts
    and not target_can_manage_accounts
    and not private.has_other_active_account_admin(target_profile_id) then
    raise exception 'at least one active account administrator is required'
      using errcode = '23514';
  end if;

  update public.profiles
  set display_name = normalised_name,
      committee_role = target_role,
      committee_position = normalised_position,
      can_manage_accounts = target_can_manage_accounts
  where id = target_profile_id;

  insert into public.account_management_audit (
    actor_profile_id,
    target_profile_id,
    action,
    previous_role,
    new_role,
    previous_can_manage_accounts,
    new_can_manage_accounts,
    previous_is_active,
    new_is_active
  ) values (
    auth.uid(),
    target_profile_id,
    'profile_updated',
    current_profile.committee_role,
    target_role,
    current_profile.can_manage_accounts,
    target_can_manage_accounts,
    current_profile.is_active,
    current_profile.is_active
  );
end;
$$;

create or replace function public.set_managed_profile_active(
  target_profile_id uuid,
  target_is_active boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
begin
  perform private.assert_account_admin();

  select * into current_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if not found then
    raise exception 'managed profile is unavailable' using errcode = 'P0002';
  end if;

  if target_profile_id = auth.uid() and not target_is_active then
    raise exception 'an account administrator cannot disable their own account'
      using errcode = '42501';
  end if;

  if current_profile.is_active
    and not target_is_active
    and current_profile.can_manage_accounts
    and not private.has_other_active_account_admin(target_profile_id) then
    raise exception 'at least one active account administrator is required'
      using errcode = '23514';
  end if;

  if current_profile.is_active = target_is_active then
    return;
  end if;

  update public.profiles
  set is_active = target_is_active
  where id = target_profile_id;

  insert into public.account_management_audit (
    actor_profile_id,
    target_profile_id,
    action,
    previous_role,
    new_role,
    previous_can_manage_accounts,
    new_can_manage_accounts,
    previous_is_active,
    new_is_active
  ) values (
    auth.uid(),
    target_profile_id,
    case
      when target_is_active then 'reactivated'::public.account_management_action
      else 'disabled'::public.account_management_action
    end,
    current_profile.committee_role,
    current_profile.committee_role,
    current_profile.can_manage_accounts,
    current_profile.can_manage_accounts,
    current_profile.is_active,
    target_is_active
  );
end;
$$;

create or replace function public.record_account_recovery_sent(
  target_profile_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_profile public.profiles%rowtype;
begin
  perform private.assert_account_admin();

  select * into current_profile
  from public.profiles
  where id = target_profile_id;

  if not found then
    raise exception 'managed profile is unavailable' using errcode = 'P0002';
  end if;

  insert into public.account_management_audit (
    actor_profile_id,
    target_profile_id,
    action,
    previous_role,
    new_role,
    previous_can_manage_accounts,
    new_can_manage_accounts,
    previous_is_active,
    new_is_active
  ) values (
    auth.uid(),
    target_profile_id,
    'recovery_sent',
    current_profile.committee_role,
    current_profile.committee_role,
    current_profile.can_manage_accounts,
    current_profile.can_manage_accounts,
    current_profile.is_active,
    current_profile.is_active
  );
end;
$$;

revoke execute on function public.create_managed_profile(
  uuid, text, public.committee_role, text, boolean
) from public, anon;
revoke execute on function public.update_managed_profile(
  uuid, text, public.committee_role, text, boolean
) from public, anon;
revoke execute on function public.set_managed_profile_active(uuid, boolean)
  from public, anon;
revoke execute on function public.record_account_recovery_sent(uuid)
  from public, anon;

grant execute on function public.create_managed_profile(
  uuid, text, public.committee_role, text, boolean
) to authenticated;
grant execute on function public.update_managed_profile(
  uuid, text, public.committee_role, text, boolean
) to authenticated;
grant execute on function public.set_managed_profile_active(uuid, boolean)
  to authenticated;
grant execute on function public.record_account_recovery_sent(uuid)
  to authenticated;

comment on column public.profiles.can_manage_accounts is
  'Independent account-administration capability; does not grant participant-data access.';
comment on column public.profiles.is_active is
  'Immediate application access switch checked by server authorization and RLS helpers.';
comment on table public.account_management_audit is
  'Append-only audit records for in-app committee account lifecycle changes; never stores credentials or tokens.';
