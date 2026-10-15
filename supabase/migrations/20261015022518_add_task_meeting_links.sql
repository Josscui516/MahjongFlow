-- Meeting associations are many-to-many; immutable source columns remain provenance.
create table public.task_meetings (
  task_id uuid not null references public.tasks(id) on delete cascade,
  meeting_id uuid not null references public.meetings(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (task_id, meeting_id)
);
create index task_meetings_meeting_idx on public.task_meetings(meeting_id, task_id);
alter table public.task_meetings enable row level security;
revoke all on public.task_meetings from public, anon, authenticated;
grant select, insert, delete on public.task_meetings to authenticated;
create policy task_meetings_backend_select on public.task_meetings for select to authenticated
  using ((select private.is_backend_user()));
create policy task_meetings_backend_insert on public.task_meetings for insert to authenticated
  with check ((select private.is_backend_user()));
create policy task_meetings_backend_delete on public.task_meetings for delete to authenticated
  using ((select private.is_backend_user()));

insert into public.task_meetings(task_id, meeting_id)
select id, source_meeting_id from public.tasks where source_meeting_id is not null;

create function private.keep_task_source_meeting_link()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.task_meetings(task_id, meeting_id)
  values (new.id, new.source_meeting_id) on conflict do nothing;
  return new;
end;
$$;
create trigger tasks_keep_source_meeting_link after insert on public.tasks
  for each row when (new.source_meeting_id is not null)
  execute function private.keep_task_source_meeting_link();

create function private.guard_task_meeting_link()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Use the existing source/delete lock to serialise linking against meeting deletion.
  perform pg_catalog.pg_advisory_xact_lock(39, 6);
  if tg_op = 'DELETE' and exists (
    select 1 from public.tasks where id = old.task_id and source_meeting_id = old.meeting_id
  ) then
    raise exception 'the original task source must remain linked' using errcode = '23514';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
create trigger task_meetings_guard before insert or delete on public.task_meetings
  for each row execute function private.guard_task_meeting_link();
revoke all on function private.keep_task_source_meeting_link(), private.guard_task_meeting_link() from public, anon, authenticated;

create function public.save_task_with_meetings(
  task_values jsonb, related_meeting_ids uuid[], target_task_id uuid default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  saved_id uuid;
  source_id uuid;
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;
  if related_meeting_ids is null or cardinality(related_meeting_ids) > 100
    or array_position(related_meeting_ids, null) is not null then
    raise exception 'choose at most 100 valid meetings' using errcode = '22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(39, 6);
  if target_task_id is null then
    insert into public.tasks(title, description, assignee_id, due_date, status, event_id,
      source_meeting_id, source_decision_id, source_discussion_point_id, created_by)
    values (task_values->>'title', task_values->>'description', (task_values->>'assignee_id')::uuid,
      (task_values->>'due_date')::date, (task_values->>'status')::public.task_status,
      (task_values->>'event_id')::uuid, (task_values->>'source_meeting_id')::uuid,
      (task_values->>'source_decision_id')::uuid, (task_values->>'source_discussion_point_id')::uuid, auth.uid())
    returning id, source_meeting_id into saved_id, source_id;
  else
    -- Source columns and author are deliberately excluded from updates.
    update public.tasks set title = task_values->>'title', description = task_values->>'description',
      assignee_id = (task_values->>'assignee_id')::uuid, due_date = (task_values->>'due_date')::date,
      status = (task_values->>'status')::public.task_status, event_id = (task_values->>'event_id')::uuid
    where id = target_task_id returning id, source_meeting_id into saved_id, source_id;
    if not found then return null; end if;
  end if;
  delete from public.task_meetings where task_id = saved_id
    and meeting_id is distinct from source_id and not (meeting_id = any(related_meeting_ids));
  insert into public.task_meetings(task_id, meeting_id)
    select saved_id, meeting_id from unnest(related_meeting_ids) as meeting_id
    on conflict do nothing;
  return saved_id;
end;
$$;
revoke all on function public.save_task_with_meetings(jsonb, uuid[], uuid) from public, anon;
grant execute on function public.save_task_with_meetings(jsonb, uuid[], uuid) to authenticated;

create or replace function public.delete_meeting_record(target_meeting_id uuid)
returns text language plpgsql security definer set search_path = '' as $$
begin
  if not (select private.is_backend_user()) then
    raise exception 'backend access required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(39, 6);
  if not exists (select 1 from public.meetings where id = target_meeting_id) then return 'not_found'; end if;
  if exists (select 1 from public.task_meetings where meeting_id = target_meeting_id)
    or exists (select 1 from public.tasks where source_meeting_id = target_meeting_id) then
    return 'linked_tasks';
  end if;
  delete from public.meetings where id = target_meeting_id;
  return 'deleted';
end;
$$;
comment on table public.task_meetings is 'Many-to-many meeting associations; original decision/discussion provenance remains on tasks.';
notify pgrst, 'reload schema';
