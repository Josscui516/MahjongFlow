-- 仅清理 dashboard-demo.sql 的固定 UUID 与标记；不删除账号或其他数据。
-- 若后续真实业务记录引用了这些活动，外键会阻止删除并回滚整个事务。
begin;
delete from public.tasks
where id in (select ('d45b2026-1021-4000-8002-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 20) n)
  and description like 'Dashboard demo batch 2026-10-21:%';
delete from public.events
where id in (select ('d45b2026-1021-4000-8001-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 9) n)
  and description like 'Dashboard demo batch 2026-10-21:%';
commit;
