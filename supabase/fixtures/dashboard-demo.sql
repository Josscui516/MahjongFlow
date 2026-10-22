-- 仅用于本地 Docker 数据库；不执行 reset、migration 或账号创建。
-- 固定 UUID 与标记确保重复执行不会重复插入或覆盖已有记录。
begin;
set local timezone = 'Australia/Sydney';

do $$
declare
  owner_id uuid;
  colleague_id uuid;
  demo_day date := current_date;
begin
  if (select count(*) from public.profiles where display_name = 'General' and is_active) <> 1 then
    raise exception 'Exactly one active General local test profile is required';
  end if;
  select id into owner_id from public.profiles where display_name = 'General' and is_active;
  select id into colleague_id from public.profiles where committee_role = 'authorised' and is_active order by id limit 1;
  if colleague_id is null then raise exception 'An existing authorised local test profile is required'; end if;
  if exists (select 1 from public.tasks where id::text like 'd45b2026-1021-4000-8002-%' and description not like 'Dashboard demo batch 2026-10-21%')
    or exists (select 1 from public.events where id::text like 'd45b2026-1021-4000-8001-%' and description not like 'Dashboard demo batch 2026-10-21%') then
    raise exception 'Demo UUID namespace collision; existing data was not changed';
  end if;

  insert into public.events (id, event_type, name, starts_at, location, description, status, created_by)
  select ('d45b2026-1021-4000-8001-' || lpad(n::text, 12, '0'))::uuid,
    kind::public.event_type, '[Demo] ' || title,
    (demo_day + day_offset + time '19:00') at time zone 'Australia/Sydney',
    venue, 'Dashboard demo batch 2026-10-21: fictional event; no participants or registrations.',
    state::public.event_status, owner_id
  from (values
    (1, 'weekly_session', 'Tonight: beginner table practice', 0, 'Fictional Club Room A', 'scheduled'),
    (2, 'weekly_session', 'Welcome and rules workshop', 1, 'Fictional Learning Studio', 'scheduled'),
    (3, 'tournament', 'Friendly weekend tournament', 3, 'Fictional Tournament Hall', 'scheduled'),
    (4, 'weekly_session', 'Strategy review and social session', 7, 'Fictional Club Room B', 'scheduled'),
    (5, 'tournament', 'Interclub practice tournament', 14, 'Fictional Community Hall', 'scheduled'),
    (6, 'weekly_session', 'New member orientation with guided practice, rules discussion and table rotation', 30, 'Fictional Student Centre, Level 2, Multi-purpose Room', 'scheduled'),
    (7, 'weekly_session', 'Past session - excluded from overview', -2, 'Fictional Archive Room', 'scheduled'),
    (8, 'tournament', 'Cancelled tournament - excluded from overview', 2, 'Fictional Hall C', 'cancelled'),
    (9, 'weekly_session', 'Completed session - excluded from overview', 4, 'Fictional Hall D', 'completed')
  ) as fixture(n, kind, title, day_offset, venue, state)
  on conflict (id) do nothing;

  insert into public.tasks (id, title, description, assignee_id, due_date, status, event_id, created_by)
  select ('d45b2026-1021-4000-8002-' || lpad(n::text, 12, '0'))::uuid,
    '[Demo] ' || title,
    'Dashboard demo batch 2026-10-21: fictional task; ' || scenario,
    case when mine then owner_id else colleague_id end,
    demo_day + day_offset, state::public.task_status,
    case when event_number is null then null else ('d45b2026-1021-4000-8001-' || lpad(event_number::text, 12, '0'))::uuid end,
    owner_id
  from (values
    (1, 'Confirm room booking', -7, 'not_started', true, 1, 'mine / overdue'),
    (2, 'Prepare tournament table layout', -3, 'in_progress', true, 3, 'mine / overdue / in progress'),
    (3, 'Check spare tile sets', -1, 'not_started', true, 1, 'mine / yesterday'),
    (4, 'Print tonight''s quick reference cards', 0, 'in_progress', true, 1, 'mine / due today'),
    (5, 'Arrange workshop practice tables', 1, 'not_started', true, 2, 'mine / due tomorrow'),
    (6, 'Review tournament rules and prepare a detailed explanation of scoring, table rotation and tie-break procedures for first-time players', 3, 'in_progress', true, 3, 'mine / long title'),
    (7, 'Send committee preparation checklist', 7, 'not_started', true, 4, 'mine / seventh-day inclusive boundary'),
    (8, 'Draft next fortnight''s session plan', 8, 'not_started', true, 5, 'mine / eighth-day normal boundary'),
    (9, 'Review equipment storage options', 14, 'in_progress', true, null, 'mine / independent task / normal'),
    (10, 'Plan next month''s orientation', 30, 'not_started', true, 6, 'mine / distant deadline'),
    (11, 'Confirm volunteer table hosts', -5, 'in_progress', false, 1, 'other owner / overdue'),
    (12, 'Check venue access instructions', -1, 'not_started', false, 2, 'other owner / overdue'),
    (13, 'Prepare welcome desk signage', 0, 'not_started', false, 1, 'other owner / due today'),
    (14, 'Check tournament scoreboard', 2, 'in_progress', false, 3, 'other owner / due soon'),
    (15, 'Review next week''s equipment list', 7, 'not_started', false, 4, 'other owner / seventh-day boundary'),
    (16, 'Prepare interclub practice schedule', 8, 'in_progress', false, 5, 'other owner / outside due-soon window'),
    (17, 'Draft committee handover notes', 21, 'not_started', false, null, 'other owner / independent task'),
    (18, 'Archive completed booking confirmation', -2, 'completed', true, 1, 'completed / past due / excluded'),
    (19, 'Finish welcome desk checklist', 0, 'completed', false, 2, 'completed / due today / excluded'),
    (20, 'Finish orientation outline', 5, 'completed', true, 6, 'completed / future due / excluded')
  ) as fixture(n, title, day_offset, state, mine, event_number, scenario)
  on conflict (id) do nothing;
end $$;
commit;
