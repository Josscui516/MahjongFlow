// 真实隔离 PostgreSQL 回归：活动隔离、共享身份、旧快照拒绝及应用角色拒绝。
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { localSql, prepareCleanup, applyCleanup } from "../../../supabase/maintenance/fictional-activity-cleanup.mjs";

const a = randomUUID(), b = randomUUID(), person = randomUUID();
const name = "Fictional Cleanup Acceptance";
const actor = randomUUID();
const backup = `tmp/fictional-cleanup-backups/${a}.json`;
function records(event) {
  return localSql(`select jsonb_build_object('r',(select jsonb_agg(to_jsonb(r) order by id) from public.registrations r where event_id='${event}'),'a',(select jsonb_agg(to_jsonb(r) order by id) from public.attendance_records r where event_id='${event}'))::text;`);
}
try {
  localSql(`begin;
    insert into auth.users(id,email) values('${actor}','cleanup-actor-${actor}@example.test');
    insert into public.profiles(id,display_name,committee_role,is_active) values('${actor}','Fictional Cleanup Operator','authorised',true);
    insert into public.events(id,name,description,event_type,status,location,starts_at,created_by)
      select id,'${name}','Fictional cleanup fixture','weekly_session','scheduled','Fictional Room',now()+interval '1 day','${actor}' from (values('${a}'::uuid),('${b}'::uuid)) t(id);
    insert into public.participants(id,full_name,email) values('${person}','Fictional Shared Attendee','cleanup-${person}@example.test');
    insert into public.registrations(event_id,participant_id,recorded_by) select id,'${person}','${actor}' from public.events where id in ('${a}','${b}');
    insert into public.attendance_records(event_id,participant_id,check_in_method,recorded_by) select id,'${person}','manual','${actor}' from public.events where id in ('${a}','${b}');
    commit;`);
  const beforeA = records(a), beforeB = records(b);
  assert.throws(() => prepareCleanup("bad", name));
  assert.throws(() => prepareCleanup(a, "Fictional Wrong Name"));
  assert.throws(() => prepareCleanup(randomUUID(), name));
  const dry = prepareCleanup(a, name);
  assert.equal(records(a), beforeA);
  assert.throws(() => applyCleanup(dry, "docs/unsafe.json"));
  assert.equal(records(a), beforeA);
  console.log("PASS R-07: bad/missing/wrong targets and unsafe backup denied; dry-run unchanged");

  for (const role of ["anon", "authenticated"]) {
    assert.throws(() => localSql(`begin; set local role ${role}; delete from public.registrations where event_id='${a}'; rollback;`));
    assert.throws(() => localSql(`begin; set local role ${role}; delete from public.attendance_records where event_id='${a}'; rollback;`));
  }
  console.log("PASS R-07: anonymous/authenticated direct maintenance DELETE denied");
  const stale = prepareCleanup(a, name);
  localSql(`update public.events set description='Fictional changed after preview' where id='${a}';`);
  assert.throws(() => applyCleanup(stale, `tmp/fictional-cleanup-backups/${a}-stale.json`));
  assert.equal(records(a), beforeA);
  console.log("PASS R-07: stale snapshot rolls back without partial deletion");
  localSql(`update public.participants set full_name='Non-fixture identity' where id='${person}';`);
  assert.throws(() => prepareCleanup(a, name));
  localSql(`update public.participants set full_name='Fictional Shared Attendee' where id='${person}';`);

  const current = prepareCleanup(a, name);
  assert.deepEqual(applyCleanup(current, backup), { registrationsRemoved: 1, attendanceRemoved: 1 });
  assert.deepEqual(JSON.parse(records(a)), { r: null, a: null });
  assert.equal(records(b), beforeB);
  assert.equal(localSql(`select count(*) from public.participants where id='${person}';`), "1");
  assert.equal(localSql(`select count(*) from public.events where id in ('${a}','${b}');`), "2");
  assert.throws(() => applyCleanup(prepareCleanup(a, name), backup));
  console.log("PASS R-07: selected relationships removed, other activity/shared identity/event preserved; backup overwrite refused");

  const stored = JSON.parse(readFileSync(backup, "utf8"));
  // 在受控本地事务恢复原始关系，再验证原行、时间和审计字段全部相同。
  localSql(`begin;
    insert into public.registrations select * from jsonb_populate_recordset(null::public.registrations, :'registration_rows'::jsonb);
    insert into public.attendance_records select * from jsonb_populate_recordset(null::public.attendance_records, :'attendance_rows'::jsonb);
    commit;`, { registration_rows: JSON.stringify(stored.data.registrations), attendance_rows: JSON.stringify(stored.data.attendance) });
  assert.equal(records(a), beforeA);
  assert.equal(records(b), beforeB);
  console.log("PASS R-07: backup recovery reproduces exact registration/attendance rows and audit timestamps");
} finally {
  localSql(`begin; delete from public.attendance_records where event_id in ('${a}','${b}'); delete from public.registrations where event_id in ('${a}','${b}'); delete from public.events where id in ('${a}','${b}'); delete from public.participants where id='${person}'; delete from public.profiles where id='${actor}'; delete from auth.users where id='${actor}'; commit;`);
}
