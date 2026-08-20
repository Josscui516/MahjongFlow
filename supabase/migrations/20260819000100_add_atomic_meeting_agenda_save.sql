create or replace function public.save_meeting_agenda(
  target_meeting_id uuid,
  discussion_items jsonb,
  decision_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  agenda_item jsonb;
  agenda_item_id uuid;
  agenda_item_content text;
  agenda_item_position integer;
begin
  if not (select private.is_backend_user()) then
    raise exception 'resource unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.meetings
  where id = target_meeting_id
  for update;

  if not found then
    raise exception 'resource unavailable' using errcode = 'P0002';
  end if;

  if jsonb_typeof(discussion_items) is distinct from 'array'
    or jsonb_typeof(decision_items) is distinct from 'array'
    or jsonb_array_length(discussion_items) > 100
    or jsonb_array_length(decision_items) > 100 then
    raise exception 'agenda item limit exceeded' using errcode = '23514';
  end if;

  if (
    select count(value ->> 'id') <> count(distinct value ->> 'id')
    from jsonb_array_elements(discussion_items)
    where value ->> 'id' is not null
  ) or (
    select count(value ->> 'id') <> count(distinct value ->> 'id')
    from jsonb_array_elements(decision_items)
    where value ->> 'id' is not null
  ) then
    raise exception 'duplicate agenda item id' using errcode = '23514';
  end if;

  for agenda_item in select value from jsonb_array_elements(discussion_items) loop
    agenda_item_content := agenda_item ->> 'content';
    if agenda_item_content is null
      or agenda_item_content <> btrim(agenda_item_content)
      or char_length(agenda_item_content) not between 1 and 5000 then
      raise exception 'invalid discussion point' using errcode = '23514';
    end if;
  end loop;

  for agenda_item in select value from jsonb_array_elements(decision_items) loop
    agenda_item_content := agenda_item ->> 'content';
    if agenda_item_content is null
      or agenda_item_content <> btrim(agenda_item_content)
      or char_length(agenda_item_content) not between 1 and 5000 then
      raise exception 'invalid meeting decision' using errcode = '23514';
    end if;
  end loop;

  update public.discussion_points
  set position = position + 100000
  where meeting_id = target_meeting_id;
  update public.meeting_decisions
  set position = position + 100000
  where meeting_id = target_meeting_id;

  agenda_item_position := 0;
  for agenda_item in select value from jsonb_array_elements(discussion_items) loop
    agenda_item_id := nullif(agenda_item ->> 'id', '')::uuid;
    agenda_item_content := agenda_item ->> 'content';
    if agenda_item_id is null then
      insert into public.discussion_points (meeting_id, content, position)
      values (target_meeting_id, agenda_item_content, agenda_item_position);
    else
      update public.discussion_points
      set content = agenda_item_content, position = agenda_item_position
      where id = agenda_item_id and meeting_id = target_meeting_id;
      if not found then
        raise exception 'discussion point unavailable' using errcode = 'P0002';
      end if;
    end if;
    agenda_item_position := agenda_item_position + 1;
  end loop;

  agenda_item_position := 0;
  for agenda_item in select value from jsonb_array_elements(decision_items) loop
    agenda_item_id := nullif(agenda_item ->> 'id', '')::uuid;
    agenda_item_content := agenda_item ->> 'content';
    if agenda_item_id is null then
      insert into public.meeting_decisions (meeting_id, content, position)
      values (target_meeting_id, agenda_item_content, agenda_item_position);
    else
      update public.meeting_decisions
      set content = agenda_item_content, position = agenda_item_position
      where id = agenda_item_id and meeting_id = target_meeting_id;
      if not found then
        raise exception 'meeting decision unavailable' using errcode = 'P0002';
      end if;
    end if;
    agenda_item_position := agenda_item_position + 1;
  end loop;

  delete from public.discussion_points
  where meeting_id = target_meeting_id
    and position >= 100000;
  delete from public.meeting_decisions
  where meeting_id = target_meeting_id
    and position >= 100000;
end;
$$;

revoke execute on function public.save_meeting_agenda(uuid, jsonb, jsonb)
  from public, anon;
grant execute on function public.save_meeting_agenda(uuid, jsonb, jsonb)
  to authenticated;

comment on function public.save_meeting_agenda(uuid, jsonb, jsonb) is
  'Atomically replaces ordered meeting discussion points and decisions for a backend user.';
