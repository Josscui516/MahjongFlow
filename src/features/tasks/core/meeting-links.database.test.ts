import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Database } from "@/types/database.generated";
vi.mock("server-only", () => ({}));
import { createTaskRepository } from "./repository";
import { createSourceNavigationRepository } from "../source-navigation/persistence";

describe.skipIf(process.env.TASK_MEETINGS_LIVE_DATABASE !== "1")("task/meeting many-to-many: real local database and RLS", () => {
  const meetings = [randomUUID(), randomUUID()];
  const decision = randomUUID();
  const users: string[] = [];
  const tasks: string[] = [];
  let privileged: SupabaseClient<Database>, committee: SupabaseClient<Database>, authorised: SupabaseClient<Database>, inactive: SupabaseClient<Database>, anonymous: SupabaseClient<Database>;
  const sql = (query: string) => execFileSync("docker", ["exec", "-i", "supabase_db_MahjongFlow", "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"], { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  const input = () => ({ assigneeId: users[0], title: "Fictional linked action", description: "Fictional multi-meeting follow-up", dueDate: "2026-11-01", status: "not_started" as const, meetingIds: meetings });
  beforeAll(async () => {
    const env = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(Boolean).map(line => { const i = line.indexOf("="); return [line.slice(0,i), line.slice(i+1)]; }));
    if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error("Local-only test");
    const options = { auth: { persistSession: false } };
    privileged = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, options);
    anonymous = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
    async function user(role: "committee" | "authorised", active = true) {
      const email = `meeting-links-${randomUUID()}@example.test`, password = randomBytes(24).toString("base64url");
      const created = await privileged.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error("Test user creation failed");
      const id = created.data.user.id; users.push(id);
      sql(`insert into public.profiles(id,display_name,committee_role,is_active)values('${id}','Fictional meeting link tester','${role}',${active});`);
      const client = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
      if ((await client.auth.signInWithPassword({ email,password })).error) throw new Error("Test login failed");
      return client;
    }
    committee = await user("committee"); authorised = await user("authorised"); inactive = await user("committee", false);
    sql(`begin; ${meetings.map((id,i) => `insert into public.meetings(id,title,starts_at,summary,created_by)values('${id}','Fictional linked meeting ${i+1}',now(),'Fictional follow-up','${users[0]}'); insert into public.meeting_attendees(meeting_id,profile_id)values('${id}','${users[0]}');`).join(" ")} insert into public.meeting_decisions(id,meeting_id,content,position)values('${decision}','${meetings[0]}','Fictional original decision',0); commit;`);
  }, 30000);
  afterAll(async () => {
    if (!users.length) return;
    sql(`delete from public.tasks where created_by in (${users.map(id=>`'${id}'`).join(",")});`);
    for (const id of meetings) sql(`delete from public.meetings where id='${id}';`);
    for (const id of users) { sql(`delete from public.profiles where id='${id}';`); await privileged.auth.admin.deleteUser(id); }
  });
  it("lets a committee member create one task linked to two meetings and see it from both", async () => {
    const repository = createTaskRepository(async () => committee);
    const saved = await repository.create(users[0], input()); tasks.push(saved.id);
    expect(saved.meetingIds).toEqual(expect.arrayContaining(meetings));
    expect(saved.relatedMeetings).toHaveLength(2);
    const navigation = createSourceNavigationRepository(async () => committee);
    for (const id of meetings) expect(await navigation.listRelatedTasks(id)).toContainEqual(expect.objectContaining({ id: saved.id, sourceKind: null }));
  });
  it("lets an authorised member add another task to the same meeting, then remove only its extra link", async () => {
    const repository = createTaskRepository(async () => authorised);
    const saved = await repository.create(users[1], input()); tasks.push(saved.id);
    expect((await createSourceNavigationRepository(async () => authorised).listRelatedTasks(meetings[0])).length).toBe(2);
    const updated = await repository.update(saved.id, { ...input(), meetingIds: [meetings[0]] });
    expect(updated?.meetingIds).toEqual([meetings[0]]);
    expect((await createSourceNavigationRepository(async () => committee).listRelatedTasks(meetings[1])).map(t=>t.id)).not.toContain(saved.id);
    expect((await repository.update(saved.id, { ...input(), meetingIds: [] }))?.meetingIds).toEqual([]);
  });
  it("backfills original sources, automatically links future conversions, and never changes provenance on edit", async () => {
    expect(sql("select count(*) from public.tasks t where source_meeting_id is not null and not exists(select 1 from public.task_meetings l where l.task_id=t.id and l.meeting_id=t.source_meeting_id);")).toBe("0");
    const repository = createTaskRepository(async () => committee);
    // The conversion path inserts tasks directly rather than using the new RPC.
    const saved = await repository.create(users[0], { ...input(), meetingIds: undefined, sourceMeetingId: meetings[0], sourceDecisionId: decision }); tasks.push(saved.id);
    expect(saved.meetingIds).toEqual([meetings[0]]);
    const edited = await repository.update(saved.id, { ...input(), sourceMeetingId: meetings[1], meetingIds: [meetings[1]] });
    expect(edited).toMatchObject({ sourceMeetingId: meetings[0], sourceDecisionId: decision });
    expect(edited?.meetingIds).toEqual(expect.arrayContaining(meetings));
    expect((await committee.from("task_meetings").delete().eq("task_id", saved.id).eq("meeting_id", meetings[0])).error?.code).toBe("23514");
    expect(await createSourceNavigationRepository(async () => committee).listRelatedTasks(meetings[0])).toContainEqual(expect.objectContaining({ id: saved.id, sourceKind: "decision", sourceId: decision }));
    expect(await createSourceNavigationRepository(async () => committee).listRelatedTasks(meetings[1])).toContainEqual(expect.objectContaining({ id: saved.id, sourceKind: null }));
  });
  it("rolls back task content and removed associations when any selected meeting is invalid", async () => {
    const repository = createTaskRepository(async () => committee), id = tasks[0];
    await expect(repository.update(id, { ...input(), title: "Must roll back", meetingIds: [randomUUID()] })).rejects.toMatchObject({ code: "23503" });
    expect(await repository.get(id)).toMatchObject({ title: "Fictional linked action", meetingIds: expect.arrayContaining(meetings) });
    const before = sql(`select count(*) from public.tasks where created_by='${users[0]}';`);
    await expect(repository.create(users[0], { ...input(), meetingIds: [randomUUID()] })).rejects.toMatchObject({ code: "23503" });
    expect(sql(`select count(*) from public.tasks where created_by='${users[0]}';`)).toBe(before);
  });
  it("enforces unique pairs, protects linked meetings, and cascades links when a task is deleted", async () => {
    expect((await committee.from("task_meetings").insert({ task_id: tasks[0], meeting_id: meetings[0] })).error?.code).toBe("23505");
    expect((await committee.rpc("delete_meeting_record", { target_meeting_id: meetings[0] })).data).toBe("linked_tasks");
    const repository = createTaskRepository(async () => committee);
    expect(await repository.delete(tasks[2])).toBe("deleted");
    expect((await committee.from("task_meetings").select("task_id").eq("task_id", tasks[2])).data).toEqual([]);
  });
  it("denies anonymous and inactive access at the database boundary", async () => {
    expect((await anonymous.from("task_meetings").select("task_id")).error).not.toBeNull();
    const args = { task_values: {}, related_meeting_ids: meetings };
    expect((await anonymous.rpc("save_task_with_meetings", args)).error).not.toBeNull();
    expect((await inactive.rpc("save_task_with_meetings", args)).error?.code).toBe("42501");
    expect((await inactive.from("task_meetings").select("task_id")).data).toEqual([]);
    expect((await inactive.from("task_meetings").insert({ task_id: tasks[0], meeting_id: meetings[0] })).error).not.toBeNull();
  });
  it("serialises concurrent edits so links and task content are one consistent save", async () => {
    const repository = createTaskRepository(async () => committee), id = tasks[0];
    await Promise.all([
      repository.update(id, { ...input(), title: "Fictional concurrent A", meetingIds: [meetings[0]] }),
      repository.update(id, { ...input(), title: "Fictional concurrent B", meetingIds: [meetings[1]] }),
    ]);
    const saved = await repository.get(id);
    expect(saved?.meetingIds).toEqual([saved?.title === "Fictional concurrent A" ? meetings[0] : meetings[1]]);
  });
});
