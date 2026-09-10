-- Issue #26: align the database participant-name boundary with the canonical
-- application contract. The original constraint rejected outer padding but
-- still accepted tabs, newlines, or repeated internal whitespace through a
-- direct authorised table request.
--
-- Existing rows are normalised before the stronger constraint is installed.
-- The preflight deliberately stops the migration, without exposing a value,
-- if an existing name cannot be normalised to a non-empty bounded name.
-- Before deployment, back up participant id, full_name, and updated_at if an
-- exact data rollback is required. Roll back with a new forward migration that
-- restores those values from the backup and reinstates the former
-- btrim-and-length check. Whitespace removed here cannot be reconstructed from
-- the migrated table alone, and normalised rows receive a new updated_at value.

do $$
begin
  if exists (
    select 1
    from public.participants
    where char_length(
      btrim(regexp_replace(full_name, '[[:space:]]+', ' ', 'g'))
    ) not between 1 and 120
  ) then
    raise exception 'an existing participant name cannot be normalised safely'
      using errcode = '23514';
  end if;
end;
$$;

update public.participants
set full_name = btrim(regexp_replace(full_name, '[[:space:]]+', ' ', 'g'))
where full_name is distinct from
  btrim(regexp_replace(full_name, '[[:space:]]+', ' ', 'g'));

alter table public.participants
  drop constraint participants_full_name_check,
  add constraint participants_full_name_check check (
    full_name = btrim(regexp_replace(full_name, '[[:space:]]+', ' ', 'g'))
    and char_length(full_name) between 1 and 120
  );

comment on constraint participants_full_name_check on public.participants is
  'Requires one canonical space between trimmed name segments and a length of 1 to 120 characters.';
