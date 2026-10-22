-- 停用活动级学号要求；兼容旧 DTO/RPC，保留既有学号数据与最小权限。
begin;
update public.events set requires_student_id = false where requires_student_id;
alter table public.events add constraint events_student_id_requirement_retired
  check (requires_student_id = false);
comment on column public.events.requires_student_id is
  'Retired compatibility field. Always false; registration never requires a student ID.';
notify pgrst, 'reload schema';
commit;
