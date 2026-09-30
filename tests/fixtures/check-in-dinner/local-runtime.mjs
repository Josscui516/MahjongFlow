// Sprint 7 专用本地验收边界。只连接命名隔离栈，密钥只在进程内传递。
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const workdir = "tmp/sprint7-db";
const container = "supabase_db_mahjongflow-issue33-sprint7";
const origin = "http://localhost:3107";
const command = process.argv[2];
const raw = execFileSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--workdir", workdir, "-o", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const config = JSON.parse(raw.slice(raw.indexOf("{")));
assert.equal(new URL(config.API_URL).origin, "http://127.0.0.1:46321", "Only the isolated Sprint 7 stack is allowed");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(config.API_URL, config.SERVICE_ROLE_KEY, options);
const eventId = "77000000-0000-4000-8000-000000000001";
const participantId = "77000000-0000-4000-8000-000000000002";
const manualId = "77000000-0000-4000-8000-000000000003";

function check(result) {
  if (result.error) throw new Error(`Local fictional operation failed (${result.error.code ?? "unknown"})`);
  return result.data;
}
function sql(query) {
  try {
    return execFileSync("docker", ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"], { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch { throw new Error("Local fictional SQL operation failed; sensitive SQL context suppressed"); }
}
function password() {
  assert.ok(process.env.SPRINT7_FIXTURE_PASSWORD, "Supply a fictional local-only password in SPRINT7_FIXTURE_PASSWORD");
  return process.env.SPRINT7_FIXTURE_PASSWORD;
}
async function setup() {
  const existing = check(await admin.auth.admin.listUsers({ perPage: 1000 })).users;
  const users = {};
  for (const role of ["authorised", "committee", "outsider"]) {
    const email = `sprint7.${role}@example.test`;
    const previous = existing.find(user => user.email === email);
    const user = previous
      ? check(await admin.auth.admin.updateUserById(previous.id, { password: password(), email_confirm: true })).user
      : check(await admin.auth.admin.createUser({ email, password: password(), email_confirm: true })).user;
    users[role] = user.id;
    if (role !== "outsider") sql(`insert into public.profiles(id,display_name,committee_role,is_active) values ('${user.id}','Fictional Sprint 7 ${role}','${role}',true) on conflict(id) do nothing;`);
  }
  sql(`begin;
    insert into public.events(id,name,description,event_type,status,location,starts_at,check_in_opens_at,check_in_closes_at,created_by)
    values ('${eventId}','Fictional Sprint 7 Acceptance','Fictional acceptance only','weekly_session','scheduled','Fictional Test Room',now()+interval '1 hour',now()-interval '1 hour',now()+interval '1 day','${users.authorised}') on conflict(id) do nothing;
    insert into public.participants(id,full_name,email) values
    ('${participantId}','Fictional QR Attendee','sprint7.qr@example.test'),
    ('${manualId}','Fictional Walk-in Attendee','sprint7.walkin@example.test') on conflict(id) do nothing;
    insert into public.registrations(event_id,participant_id,recorded_by) values ('${eventId}','${participantId}','${users.authorised}') on conflict(event_id,participant_id) do nothing;
    commit;`);
  mkdirSync("tmp", { recursive: true });
  writeFileSync("tmp/sprint7-fixture.json", JSON.stringify({ eventId, participantId, manualId, users }, null, 2));
  console.log("Fictional role accounts, one event, one registration and an unregistered walk-in are ready. No credentials printed.");
}
async function verifyHttp() {
  const fixture = JSON.parse(readFileSync("tmp/sprint7-fixture.json", "utf8"));
  const event = randomUUID();
  const participant = randomUUID();
  const email = `sprint7-http-${participant}@example.test`;
  const user = createClient(config.API_URL, config.ANON_KEY, options);
  check(await user.auth.signInWithPassword({ email: "sprint7.authorised@example.test", password: password() }));
  const post = async (token, body) => {
    const response = await fetch(`${origin}/api/check-in/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    assert.equal(response.headers.get("cache-control"), "no-store");
    const payload = await response.json();
    assert.deepEqual(Object.keys(payload).sort(), ["outcome"]);
    return { status: response.status, outcome: payload.outcome };
  };
  try {
    sql(`begin; insert into public.events(id,name,description,event_type,status,location,starts_at,check_in_opens_at,check_in_closes_at,created_by) values ('${event}','Fictional HTTP Acceptance','Fictional HTTP test','weekly_session','scheduled','Test Room',now()+interval '1 hour',now()-interval '1 minute',now()+interval '1 hour','${fixture.users.authorised}'); insert into public.participants(id,full_name,email) values ('${participant}','Fictional HTTP Attendee','${email}'); commit;`);
    check(await user.from("registrations").insert({ event_id: event, participant_id: participant }));
    const rotated = check(await admin.rpc("rotate_event_check_in_token", { target_event_id: event, actor_id: fixture.users.authorised }));
    const token = rotated[0].token;
    const results = await Promise.all([post(token, { email }), post(token, { email })]);
    assert.deepEqual(results.map(r => r.outcome).sort(), ["already_processed", "success"]);
    const rows = check(await user.from("attendance_records").select("*").eq("event_id", event));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].check_in_method, "qr");
    assert.equal(rows[0].recorded_by, null);
    check(await user.from("attendance_records").update({ attendance_status: "voided" }).eq("id", rows[0].id));
    const voided = check(await user.from("attendance_records").select("*").eq("event_id", event));
    assert.equal((await post(token, { email })).outcome, "already_processed");
    assert.deepEqual(check(await user.from("attendance_records").select("*").eq("event_id", event)), voided);
    assert.equal((await post(token, { email: "missing@example.test" })).outcome, "unable_to_process");
    assert.equal((await post("0".repeat(64), { email })).outcome, "unavailable");
    for (let i = 0; i < 8; i++) await post(token, { email });
    assert.equal((await post(token, { email })).status, 429);
    check(await admin.rpc("revoke_event_check_in_token", { target_event_id: event, actor_id: fixture.users.authorised }));
    const context = check(await admin.rpc("get_check_in_context", { check_in_token: token }));
    assert.equal(context[0].result, "unavailable");
    console.log("PASS K-02/03/04/05/08: real HTTP concurrent QR, audit, voided retry, invalid input, no-store/minimal outcomes, distributed rate limit and revocation");
  } finally {
    sql(`begin; delete from public.attendance_records where event_id='${event}'; delete from public.registrations where event_id='${event}'; delete from public.event_check_in_tokens where event_id='${event}'; delete from public.events where id='${event}'; delete from public.participants where id='${participant}'; commit;`);
  }
}
if (command === "setup") await setup();
else if (command === "verify-http") await verifyHttp();
else if (command === "verify-rollback") {
  const result = sql(`begin;
    create temporary table before_rollback as select row_to_json(a)::text as row from public.attendance_records a;
    revoke execute on function public.consume_check_in_rate_limit(text,integer,integer) from service_role;
    revoke execute on function public.submit_event_check_in(text,text,text) from service_role;
    select (not has_function_privilege('service_role','public.consume_check_in_rate_limit(text,integer,integer)','execute'))
      and (not has_function_privilege('service_role','public.submit_event_check_in(text,text,text)','execute'))
      and not exists ((select row from before_rollback except select row_to_json(a)::text from public.attendance_records a)
      union all (select row_to_json(a)::text from public.attendance_records a except select row from before_rollback));
    rollback;`);
  assert.equal(result, "t");
  console.log("PASS: transactional public-write disable preserves every attendance row; rollback restores grants");
}
else if (["build", "start", "dev"].includes(command)) {
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: config.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: config.ANON_KEY, SUPABASE_SECRET_KEY: config.SERVICE_ROLE_KEY, APP_BASE_URL: origin };
  const args = command === "build" ? ["build"] : [command, "-p", "3107", "-H", "localhost"];
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", ...args], { env, stdio: "inherit" });
  child.on("exit", code => { process.exitCode = code ?? 1; });
} else throw new Error("Use setup, verify-http, verify-rollback, build, start or dev");
