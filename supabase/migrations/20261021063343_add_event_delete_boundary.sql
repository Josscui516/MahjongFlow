create function public.delete_event_record(target_event_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;
  perform 1 from public.events where id = target_event_id for update;
  if not found then return 'not_found'; end if;
  -- Existing RESTRICT foreign keys protect tasks and private operational records,
  -- including concurrent inserts. Never expose which private records exist.
  begin
    delete from public.events where id = target_event_id;
  exception when foreign_key_violation then
    return 'linked_records';
  end;
  return 'deleted';
end;
$$;
revoke all on function public.delete_event_record(uuid) from public, anon;
grant execute on function public.delete_event_record(uuid) to authenticated;
comment on function public.delete_event_record(uuid) is
  'Backend-only deletion of unreferenced events. Existing linked records block deletion; event QR tokens cascade.';
