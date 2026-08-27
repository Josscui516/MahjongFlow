revoke delete on table public.tasks from authenticated;

create or replace function public.delete_task_record(target_task_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;

  -- Serialise against decision/discussion conversion so a source cannot be
  -- converted while its existing task is being removed.
  perform pg_catalog.pg_advisory_xact_lock(39, 6);

  if not exists (
    select 1 from public.tasks where id = target_task_id
  ) then
    return 'not_found';
  end if;

  delete from public.tasks where id = target_task_id;
  return 'deleted';
end;
$$;

revoke all on function public.delete_task_record(uuid) from public, anon;
grant execute on function public.delete_task_record(uuid) to authenticated;

comment on function public.delete_task_record(uuid) is
  'Permanently deletes one task through a backend-only boundary without deleting its source meeting or agenda record.';
