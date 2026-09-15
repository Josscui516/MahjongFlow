/* eslint-disable @typescript-eslint/no-require-imports -- standalone local acceptance runtime */
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

const runtime = path.join(os.tmpdir(), 'mahjongflow-s5-acceptance');
function config() {
  const raw = execFileSync(process.execPath, ['node_modules/supabase/dist/supabase.js', 'status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const value = JSON.parse(raw.slice(raw.indexOf('{')));
  if (new URL(value.API_URL).hostname !== '127.0.0.1' || new URL(value.API_URL).port !== '45321') throw new Error('Requires the existing dedicated loopback Supabase on port 45321.');
  return value;
}
function sql(statement) {
  try { return execFileSync('docker', ['exec', '-i', 'supabase_db_MahjongFlow', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-At'], { input: statement, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }); } catch (error) { console.error(String(error.stderr).split('\n').filter(line => line.includes('ERROR:')).join('\n')); throw new Error('Fixture SQL rejected'); }
}
async function provision() {
  fs.mkdirSync(runtime, { recursive: true });
  const c = config();
  const admin = createClient(c.API_URL, c.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const accounts = {};
  const suffix = crypto.randomBytes(5).toString('hex');
  for (const role of ['committee', 'authorised', 'outsider']) {
    const email = `s5-${role}-${suffix}@example.test`, password = crypto.randomBytes(24).toString('hex');
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) { console.error('Local Auth error:', error.code, error.status); throw new Error('Could not create local fictional account.'); }
    accounts[role] = { id: data.user.id, email, password };
    if (role !== 'outsider') sql(`insert into public.profiles(id,display_name,committee_role,committee_position,can_manage_accounts) values ('${data.user.id}','Fictional S5 ${role}','${role}','Acceptance tester',false);`);
  }
  const eventId = crypto.randomUUID(), meetingId = crypto.randomUUID(), decisionId = crypto.randomUUID();
  sql(`begin;
    insert into public.events(id,name,description,starts_at,location,event_type,status,created_by) values ('${eventId}','Fictional S5 fixture event','Acceptance relation only',now()+interval '7 days','Fictional room','weekly_session','scheduled','${accounts.committee.id}');
    insert into public.meetings(id,title,starts_at,summary,created_by) values ('${meetingId}','Fictional S5 planning','2026-09-15T01:00:00Z','Discuss fictional follow-up','${accounts.committee.id}');
    insert into public.meeting_attendees(meeting_id,profile_id) values ('${meetingId}','${accounts.committee.id}');
    insert into public.meeting_decisions(id,meeting_id,content,position) values ('${decisionId}','${meetingId}','Confirm the fictional venue booking',0);
    commit;`);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const date = (offset) => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
  const tasks = [
    { title: 'Fictional S5 overdue venue', offset: -1, status: 'in_progress' },
    { title: 'Fictional S5 due today', offset: 0, status: 'not_started' },
    { title: 'Fictional S5 day seven', offset: 7, status: 'not_started' },
    { title: 'Fictional S5 later task', offset: 8, status: 'not_started' },
    { title: 'Fictional S5 completed', offset: -1, status: 'completed' },
  ].map(({ title, offset, status }) => ({ id: crypto.randomUUID(), title, description: 'Disposable local Sprint 5 acceptance fixture.', due_date: date(offset), status, assignee_id: accounts.committee.id, created_by: accounts.committee.id, event_id: eventId }));
  for (const task of tasks) sql(`insert into public.tasks(id,title,description,due_date,status,assignee_id,created_by,event_id) values ('${task.id}','${task.title}','${task.description}','${task.due_date}','${task.status}','${task.assignee_id}','${task.created_by}','${task.event_id}');`);
  fs.writeFileSync(path.join(runtime, 'accounts.json'), JSON.stringify({ accounts, eventId, meetingId, decisionId, tasks, today }));
  console.log('Provisioned three fictional local accounts and five task fixtures; credentials remain outside the repository.');
}
async function main() {
  const action = process.argv[2];
  if (!['provision', 'test', 'build', 'serve'].includes(action)) throw new Error('Unknown local acceptance command.');
  if (action === 'provision') return provision();
  const c = config();
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: c.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: c.ANON_KEY, SUPABASE_SECRET_KEY: c.SERVICE_ROLE_KEY, APP_BASE_URL: 'http://localhost:3005', S5_RUNTIME_DIR: runtime, S5_REAL_DATABASE: '1' };
  const args = action === 'test' ? ['node_modules/vitest/vitest.mjs', 'run', 'tests/acceptance/task-follow-up'] : action === 'build' ? ['node_modules/next/dist/bin/next', 'build'] : ['node_modules/next/dist/bin/next', 'start', '-p', '3005'];
  const child = spawn(process.execPath, args, { env, stdio: 'inherit' });
  child.on('exit', (code) => { process.exitCode = code ?? 1; });
}
main().catch(() => { console.error('Local Sprint 5 runtime failed. Check the fixture database and command configuration; no credentials were printed.'); process.exitCode = 1; });
