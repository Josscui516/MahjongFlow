// Local-only disposable database check. No ports, tokens or remote DB URLs.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
const container = process.argv[2] ?? "mahjongflow-issue27-db";
if (!/^mahjongflow-issue27-[a-z0-9-]+$/.test(container)) throw new Error("Use a disposable issue27 container only");
const actor = "27000000-0000-4000-8000-000000000051";
const event = "27000000-0000-4000-8000-000000000052";
const participant = "27000000-0000-4000-8000-000000000053";
function sql(query, allowFailure = false) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", ["exec", "-i", container, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"]);
    let output = "", error = "";
    child.stdout.on("data", chunk => output += chunk);
    child.stderr.on("data", chunk => error += chunk);
    child.on("error", reject);
    child.on("close", code => code && !allowFailure ? reject(new Error(error)) : resolve({ code, output: output.trim(), error }));
    child.stdin.end(query);
  });
}
const auth = `set role authenticated; set request.jwt.claim.sub = '${actor}'; set request.jwt.claim.role = 'authenticated'; set request.jwt.claims = '{"sub":"${actor}","role":"authenticated"}';`;
await sql(`insert into auth.users(id,email) values ('${actor}','issue27-race@example.test');
insert into public.profiles(id,display_name,committee_role) values ('${actor}','Fictional Race Operator','authorised');
insert into public.events(id,event_type,name,starts_at,location,description,created_by) values ('${event}','weekly_session','Fictional race event',now(),'Fictional Room','Issue27 race fixture','${actor}');
insert into public.participants(id,full_name,email) values ('${participant}','Fictional Race Person','issue27-race-person@example.test');`);
try {
  const insert = `insert into public.registrations(event_id,participant_id) values ('${event}','${participant}');`;
  const first = sql(`begin; ${auth} ${insert} select pg_sleep(0.5); commit;`, true);
  const second = sql(`begin; ${auth} ${insert} commit;`, true);
  const results = await Promise.all([first, second]);
  assert.equal(results.filter(result => result.code === 0).length, 1);
  assert(results.some(result => result.error.includes("registrations_event_participant_key")));
  assert.equal((await sql(`select count(*) from public.registrations where event_id='${event}';`)).output, "1");
  const version = (await sql(`select updated_at from public.registrations where event_id='${event}';`)).output;
  await delay(10);
  await sql(`${auth} update public.registrations set registration_status='cancelled' where event_id='${event}';`);
  const stale = await sql(`${auth} with changed as (update public.registrations set registration_status='registered' where event_id='${event}' and updated_at='${version}' returning id) select count(*) from changed;`);
  assert.equal(stale.output, "0");
  assert.equal((await sql(`select registration_status from public.registrations where event_id='${event}';`)).output, "cancelled");
  console.log("PASS: two-connection duplicate registration produces one row; stale-version restore changes zero rows.");
} finally {
  await sql(`delete from public.registrations where event_id='${event}'; delete from public.participants where id='${participant}'; delete from public.events where id='${event}'; delete from public.profiles where id='${actor}'; delete from auth.users where id='${actor}';`);
}
