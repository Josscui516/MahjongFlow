// #33 本地双连接验收：不接收远程 URL，不改 schema，随机虚构 fixture 最后精确清理。
// node tests/integration/attendance/manual/database-concurrency.mjs [local-container]
// 第一事务保持未提交，确认第二连接确实被锁阻塞后才提交，不能以顺序请求冒充并发。
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const container = process.argv[2] ?? "supabase_db_MahjongFlow";
if (!/^(supabase_db_MahjongFlow|supabase_db_mahjongflow-issue33-sprint7|mahjongflow-issue33-[a-z0-9-]+)$/.test(container)) {
  throw new Error("Use the local MahjongFlow or a disposable issue33 Docker container only");
}

const actor = randomUUID();
const secondActor = randomUUID();
const event = randomUUID();
const participant = randomUUID();
const token = randomBytes(32).toString("hex");
const runId = randomBytes(6).toString("hex");
const email = `issue33-race-${runId}@example.test`;
const running = new Set();

function start(query, applicationName = `issue33-${runId}-query`, keepOpen = false) {
  const child = spawn("docker", [
    "exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1",
    "-v", "VERBOSITY=verbose", "-U", "postgres", "-d", "postgres",
  ]);
  let output = "";
  let error = "";
  let finished = false;
  running.add(child);
  const completed = new Promise((resolve, reject) => {
    child.stdout.on("data", chunk => { output += chunk; });
    child.stderr.on("data", chunk => { error += chunk; });
    child.once("error", () => reject(new Error("Could not start the local database test connection")));
    child.once("close", code => {
      finished = true;
      running.delete(child);
      // 不输出 stderr；错误上下文可能包含仅在内存中生成的测试 token。
      resolve({ code, output: output.trim(), sqlstate: error.match(/ERROR:\s+([A-Z0-9]{5})/)?.[1] });
    });
  });
  child.stdin.on("error", () => {});
  child.stdin.write(`set application_name = '${applicationName}'; set statement_timeout = '12s'; ${query}\n`);
  if (!keepOpen) child.stdin.end();
  return {
    child,
    completed,
    async ready() {
      const deadline = Date.now() + 8000;
      while (!output.includes("issue33-holder-ready")) {
        if (finished || Date.now() > deadline) throw new Error("Holding transaction did not become ready");
        await delay(25);
      }
    },
  };
}

async function sql(query) {
  const result = await start(query).completed;
  if (result.code !== 0) throw new Error(`Local database test failed (${result.sqlstate ?? "connection"})`);
  return result.output;
}

function authorised(user = actor) {
  return `set local role authenticated;
    set local request.jwt.claim.sub = '${user}';
    set local request.jwt.claim.role = 'authenticated';
    set local request.jwt.claims = '{"sub":"${user}","role":"authenticated"}';`;
}

const serviceRole = `set local role service_role;
  set local request.jwt.claim.sub = '';
  set local request.jwt.claim.role = 'service_role';
  set local request.jwt.claims = '{"role":"service_role"}';`;
const manualInsert = `insert into public.attendance_records(event_id, participant_id) values ('${event}', '${participant}');`;
const qrInsert = `select public.submit_event_check_in('${token}', '${email}', null);`;

async function waitForBlocked(holderName, contenderName) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    const blocked = await sql(`select exists (
      select 1 from pg_stat_activity contender
      join pg_stat_activity holder on holder.application_name = '${holderName}'
      where contender.application_name = '${contenderName}'
        and contender.wait_event_type = 'Lock'
        and holder.pid = any(pg_blocking_pids(contender.pid))
    );`);
    if (blocked === "t") return;
    await delay(25);
  }
  throw new Error("The second transaction did not demonstrably overlap and block on the first");
}

async function overlap(firstQuery, secondQuery, label) {
  const holderName = `issue33-${runId}-${label}-first`;
  const contenderName = `issue33-${runId}-${label}-second`;
  const first = start(`begin; ${firstQuery} select 'issue33-holder-ready';`, holderName, true);
  let second;
  try {
    await first.ready();
    second = start(`begin; ${secondQuery} commit;`, contenderName);
    await waitForBlocked(holderName, contenderName);
    first.child.stdin.end("commit;\n");
    return await Promise.all([first.completed, second.completed]);
  } finally {
    if (!first.child.stdin.writableEnded) first.child.stdin.end("rollback;\n");
    await first.completed;
    if (second) await second.completed;
  }
}

async function snapshot() {
  return JSON.parse(await sql(`select to_jsonb(a) from public.attendance_records a
    where event_id = '${event}' and participant_id = '${participant}';`));
}

async function assertSingle(method, recorder) {
  assert.equal(await sql(`select count(*) from public.attendance_records where event_id = '${event}' and participant_id = '${participant}';`), "1");
  const row = await snapshot();
  assert.equal(row.check_in_method, method);
  assert.equal(row.attendance_status, "confirmed");
  assert.equal(row.recorded_by, recorder);
  return row;
}

try {
  // 每次 UUID／邮箱均随机，不覆盖或预先删除任何已有数据。
  await sql(`begin;
    insert into auth.users(id,email) values
      ('${actor}', 'issue33-operator-${runId}@example.test'),
      ('${secondActor}', 'issue33-corrector-${runId}@example.test');
    insert into public.profiles(id,display_name,committee_role) values
      ('${actor}', 'Fictional Race Operator', 'authorised'),
      ('${secondActor}', 'Fictional Race Corrector', 'authorised');
    insert into public.events(id,event_type,name,starts_at,location,description,created_by,check_in_opens_at,check_in_closes_at)
    values ('${event}', 'weekly_session', 'Fictional Manual QR Race', now(), 'Fictional Room',
      'Issue 33 temporary race fixture', '${actor}', now() - interval '1 hour', now() + interval '1 hour');
    insert into public.participants(id,full_name,email) values ('${participant}', 'Fictional Race Attendee', '${email}');
    insert into public.registrations(event_id,participant_id,recorded_by) values ('${event}','${participant}','${actor}');
    insert into public.event_check_in_tokens(event_id,token_digest,created_by)
      values ('${event}', encode(extensions.digest('${token}', 'sha256'), 'hex'), '${actor}');
    commit;`);

  const manualFirst = await overlap(`${authorised()} ${manualInsert}`, `${serviceRole} ${qrInsert}`, "manual-first");
  assert.equal(manualFirst[0].code, 0);
  assert.equal(manualFirst[1].code, 0);
  assert.equal(manualFirst[1].output, "already_processed");
  const manual = await assertSingle("manual", actor);
  await sql(`begin; ${serviceRole} ${qrInsert} commit;`);
  assert.deepEqual(await snapshot(), manual, "QR retries must preserve the manual winner's entire row");
  console.log("PASS K-04: manual-first / blocked QR leaves one manual row and preserves its audit fields");

  // 仅清除本 runner 创建的精确活动／参与者组合，为反向竞争复用虚构 fixture。
  await sql(`delete from public.attendance_records where event_id = '${event}' and participant_id = '${participant}';`);
  const qrFirst = await overlap(`${serviceRole} ${qrInsert}`, `${authorised()} ${manualInsert}`, "qr-first");
  assert.equal(qrFirst[0].code, 0);
  assert.match(qrFirst[0].output, /^success\nissue33-holder-ready$/);
  assert.notEqual(qrFirst[1].code, 0);
  assert.equal(qrFirst[1].sqlstate, "23505");
  const qr = await assertSingle("qr", null);
  console.log("PASS K-04: QR-first / blocked manual receives unique violation and leaves one untouched QR row");

  const correction = `with changed as (
    update public.attendance_records set attendance_status = 'voided'
    where event_id = '${event}' and id = '${qr.id}'
      and updated_at = '${qr.updated_at}'::timestamptz and attendance_status = 'confirmed'
    returning id
  ) select count(*) from changed;`;
  const corrections = await overlap(`${authorised()} ${correction}`, `${authorised(secondActor)} ${correction}`, "correction");
  assert.equal(corrections[0].code, 0);
  assert.equal(corrections[1].code, 0);
  assert.match(corrections[0].output, /^1\nissue33-holder-ready$/);
  assert.equal(corrections[1].output, "0");
  const voided = await snapshot();
  assert.equal(voided.attendance_status, "voided");
  assert.equal(voided.recorded_by, actor);
  assert.notEqual(voided.updated_at, qr.updated_at);
  for (const field of ["id", "event_id", "participant_id", "checked_in_at", "check_in_method", "created_at"]) {
    assert.equal(voided[field], qr[field]);
  }
  assert.equal(await sql(`begin; ${serviceRole} ${qrInsert} commit;`), "already_processed");
  assert.deepEqual(await snapshot(), voided, "QR retry cannot restore a manually voided row");
  console.log("PASS K-06: concurrent corrections admit one CAS update, preserve provenance and reject stale overwrite");

  const restored = await sql(`begin; ${authorised(secondActor)} with changed as (
    update public.attendance_records set attendance_status = 'confirmed'
    where event_id = '${event}' and id = '${qr.id}' and attendance_status = 'voided'
      and updated_at = '${voided.updated_at}'::timestamptz returning id
  ) select count(*) from changed; commit;`);
  assert.equal(restored, "1");
  const restoredRow = await snapshot();
  assert.equal(restoredRow.attendance_status, "confirmed");
  assert.equal(restoredRow.recorded_by, secondActor);
  assert.notEqual(restoredRow.updated_at, voided.updated_at);
  assert.equal(restoredRow.checked_in_at, qr.checked_in_at);
  assert.equal(restoredRow.check_in_method, "qr");
  console.log("PASS K-06: fresh-version restore saves the current second operator and retains QR origin");
} finally {
  for (const child of running) {
    if (!child.stdin.writableEnded) child.stdin.end("rollback;\n");
  }
  // 不使用宽泛 email/prefix 删除，不触碰其他测试、共享用户或 schema。
  await sql(`begin;
    delete from public.attendance_records where event_id = '${event}' and participant_id = '${participant}';
    delete from public.registrations where event_id = '${event}' and participant_id = '${participant}';
    delete from public.event_check_in_tokens where event_id = '${event}';
    delete from public.events where id = '${event}';
    delete from public.participants where id = '${participant}';
    delete from public.profiles where id in ('${actor}', '${secondActor}');
    delete from auth.users where id in ('${actor}', '${secondActor}');
    commit;`);
  assert.equal(await sql(`select
    (select count(*) from auth.users where id in ('${actor}', '${secondActor}')) +
    (select count(*) from public.events where id = '${event}') +
    (select count(*) from public.participants where id = '${participant}');`), "0");
  console.log("PASS: exact fictional fixtures removed; no schema changes or database reset");
}
