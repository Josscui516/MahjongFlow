// PRIV-04：仅供命名本地隔离栈的维护者使用，不建立应用接口或扩大 RLS。
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative, isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";

const CONTAINER = "supabase_db_mahjongflow-issue33-sprint7";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function localSql(query, variables = {}) {
  const args = ["exec", "-i", CONTAINER, "psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"];
  for (const [key, value] of Object.entries(variables)) args.push("-v", `${key}=${value}`);
  try {
    return execFileSync("docker", args, { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 30000 }).trim();
  } catch {
    throw new Error("Isolated maintenance rejected or unavailable; no SQL or personal values logged.");
  }
}

function snapshot(eventId) {
  return `select jsonb_build_object(
    'event', (select to_jsonb(e) from public.events e where id='${eventId}'),
    'registrations', coalesce((select jsonb_agg(to_jsonb(r) order by id) from public.registrations r where event_id='${eventId}'), '[]'::jsonb),
    'attendance', coalesce((select jsonb_agg(to_jsonb(a) order by id) from public.attendance_records a where event_id='${eventId}'), '[]'::jsonb),
    'participants', coalesce((select jsonb_agg(to_jsonb(p) order by id) from public.participants p where id in
      (select participant_id from public.registrations where event_id='${eventId}' union select participant_id from public.attendance_records where event_id='${eventId}')), '[]'::jsonb)
  )::text as payload`;
}

export function prepareCleanup(eventId, expectedName) {
  if (!UUID.test(eventId) || !expectedName?.startsWith("Fictional ")) throw new Error("Require an exact UUID and Fictional event name.");
  const raw = localSql(`${snapshot(eventId)};`);
  const data = JSON.parse(raw);
  if (data.event?.name !== expectedName) throw new Error("Event not found or exact fictional-name confirmation mismatched.");
  if (data.participants.some(p => !p.full_name.startsWith("Fictional ") || !p.email.endsWith("@example.test"))) {
    throw new Error("Target includes identities outside the fictional fixture convention.");
  }
  return { eventId, data, digest: createHash("md5").update(raw).digest("hex") };
}

export function applyCleanup(prepared, backupPath) {
  if (!UUID.test(prepared.eventId) || !/^[0-9a-f]{32}$/.test(prepared.digest)) throw new Error("Invalid prepared operation.");
  // 备份必须先落盘；随后锁定、重新比对完整快照，变化即回滚。
  const destination = resolve(backupPath);
  const allowed = resolve("tmp/fictional-cleanup-backups");
  const delta = relative(allowed, destination);
  if (!delta || delta.startsWith("..") || isAbsolute(delta)) throw new Error("Backup must be inside tmp/fictional-cleanup-backups.");
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, JSON.stringify({ version: 1, container: CONTAINER, ...prepared }, null, 2), { flag: "wx", mode: 0o600 });
  const query = String.raw`begin;
    set local lock_timeout='5s';
    select id from public.events where id=:'event_id'::uuid for update;
    lock table public.registrations, public.attendance_records, public.participants in share row exclusive mode;
    create temporary table cleanup_snapshot on commit drop as ${snapshot(prepared.eventId)};
    select md5(payload)=:'digest' as unchanged from cleanup_snapshot \gset
    \if :unchanged
      delete from public.attendance_records where event_id=:'event_id'::uuid;
      delete from public.registrations where event_id=:'event_id'::uuid;
      commit;
    \else
      rollback;
      select 1/0; -- ON_ERROR_STOP 使旧快照明确返回失败。
    \endif`;
  localSql(query, { event_id: prepared.eventId, digest: prepared.digest });
  return { registrationsRemoved: prepared.data.registrations.length, attendanceRemoved: prepared.data.attendance.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const [eventId, expectedName, mode, backupPath] = process.argv.slice(2);
    if (mode && mode !== "--apply") throw new Error("Only dry-run or --apply is supported.");
    const prepared = prepareCleanup(eventId, expectedName);
    const counts = { registrations: prepared.data.registrations.length, attendance: prepared.data.attendance.length };
    if (mode === "--apply") {
      if (!backupPath) throw new Error("An unused backup filename is required.");
      console.log(JSON.stringify({ mode: "applied", ...applyCleanup(prepared, backupPath) }));
    } else console.log(JSON.stringify({ mode: "dry-run", ...counts }));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
