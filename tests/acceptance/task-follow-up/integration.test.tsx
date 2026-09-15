import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
// SSR-only navigation context; Auth, HTTP, persistence and RLS remain real.
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
import type { Database } from "@/types/database.generated";
import { createTaskRepository } from "@/features/tasks/core/repository";
import { createTaskService } from "@/features/tasks/core/service";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { createDashboardTaskQuery } from "@/features/dashboard/task-query-adapter";
import { loadDashboardSnapshot } from "@/features/dashboard/service";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { TaskList } from "@/features/tasks/list/TaskList";
import { parseTaskFilterCriteria } from "@/features/tasks/list/search-params";
import { AuthorizationError, type AccessContext } from "@/lib/auth/authorization";

type Account = { id: string; email: string; password: string };
type Fixture = { accounts: Record<"committee" | "authorised" | "outsider", Account>; eventId: string; meetingId: string; decisionId: string; today: string; tasks: { id: string }[] };
const live = process.env.S5_REAL_DATABASE === "1";

describe.skipIf(!live)("Sprint 5 real Auth/PostgREST/RLS and application adapter acceptance", () => {
  let fixture: Fixture;
  let committee: SupabaseClient<Database>;
  let authorised: SupabaseClient<Database>;
  let outsider: SupabaseClient<Database>;
  let anonymous: SupabaseClient<Database>;
  const client = () => createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
  beforeAll(async () => {
    expect(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname).toBe("127.0.0.1");
    fixture = JSON.parse(readFileSync(join(process.env.S5_RUNTIME_DIR!, "accounts.json"), "utf8"));
    [committee, authorised, outsider, anonymous] = [client(), client(), client(), client()];
    for (const [db, role] of [[committee, "committee"], [authorised, "authorised"], [outsider, "outsider"]] as const) {
      const { error } = await db.auth.signInWithPassword(fixture.accounts[role]);
      expect(error === null).toBe(true);
    }
  });
  function service(db: SupabaseClient<Database>) {
    return createTaskService({ repository: createTaskRepository(async () => db), authorise: async (): Promise<AccessContext> => {
      const { data: { user } } = await db.auth.getUser();
      if (!user) throw new AuthorizationError("UNAUTHENTICATED");
      const { data } = await db.from("profiles").select("committee_role,is_active").eq("id", user.id).maybeSingle();
      if (!data?.is_active) throw new AuthorizationError("FORBIDDEN");
      return { userId: user.id, role: data.committee_role, canManageAccounts: false };
    } });
  }
  it("T-05-S5 applies each real database filter and their AND intersection, including event relations and exact pagination", async () => {
    const repo = createTaskRepository(async () => committee);
    const base = { page: 1, pageSize: 2, search: "Fictional S5", sort: "due_soonest" as const, status: "all" as const, eventId: fixture.eventId };
    const first = await repo.query!(base);
    expect(first.total).toBe(5); expect(first.items).toHaveLength(2);
    const second = await repo.query!({ ...base, page: 2 });
    expect(second.total).toBe(5); expect(second.items.map(t => t.id).some(id => first.items.some(t => t.id === id))).toBe(false);
    for (const extra of [{ assigneeId: fixture.accounts.committee.id }, { status: "not_started" as const }, { dueFrom: fixture.today, dueTo: fixture.today }]) {
      const result = await repo.query!({ ...base, pageSize: 100, ...extra });
      expect(result.total).toBe(extra.status ? 3 : extra.dueFrom ? 1 : 5);
    }
    const combined = await repo.query!({ ...base, assigneeId: fixture.accounts.committee.id, status: "not_started", dueFrom: fixture.today, dueTo: fixture.today });
    expect(combined.total).toBe(1); expect(combined.items[0].dueDate).toBe(fixture.today);
    expect((await repo.query!({ ...base, eventId: randomUUID() })).total).toBe(0);
    expect(parseTaskFilterCriteria({ eventId: "bad", dueFrom: "2026-02-30" }).ok).toBe(false);
    expect(parseTaskFilterCriteria({ dueFrom: "2026-10-02", dueTo: "2026-10-01" }).ok).toBe(false);
  });
  it("T-04/T-06-S5/T-07 persists completion without changing source columns, refreshes totals, and renders both reminder hosts", async () => {
    const s = service(committee);
    const reset = await s.getTask(fixture.tasks[0].id);
    if (!reset.ok) throw new Error("Missing fixture");
    expect((await s.updateTask(reset.record.id, { ...reset.record, status: "in_progress" })).ok).toBe(true);
    const now = new Date(`${fixture.today}T02:00:00Z`);
    const query = createDashboardTaskQuery({ listTasks: s.listTasks, classifyDueRisk: classifyTaskDueRisk });
    const before = await loadDashboardSnapshot(fixture.accounts.committee.id, now, query);
    const overdue = before.sections.find(x => x.ok && x.section.key === "overdue");
    expect(overdue?.ok).toBe(true);
    const record = await s.getTask(fixture.tasks[0].id);
    expect(record.ok).toBe(true); if (!record.ok) throw new Error("Missing fictional record");
    const html = renderToStaticMarkup(<DashboardView snapshot={before} upcomingEvents={{ state: "not_connected" }} />);
    expect(html).toContain('data-due-risk="overdue"'); expect(html).toContain('data-due-risk="dueSoon"');
    const parsed = parseTaskFilterCriteria({ eventId: fixture.eventId });
    if (!parsed.ok) throw new Error("Invalid fixture");
    const list = await s.listTasks(parsed.criteria); if (!list.ok) throw new Error("Query failed");
    const listHtml = renderToStaticMarkup(<TaskList items={list.items} total={list.total} criteria={parsed.criteria} assigneeLabels={new Map()} now={now} />);
    expect(listHtml).toContain('data-due-risk="overdue"'); expect(listHtml).toContain('data-due-risk="dueSoon"');
    const updated = await s.updateTask(record.record.id, { ...record.record, status: "completed" });
    expect(updated.ok).toBe(true);
    const after = await loadDashboardSnapshot(fixture.accounts.committee.id, now, query);
    for (const section of after.sections) { expect(section.ok).toBe(true); if (section.ok) expect(section.section.items.some(t => t.id === record.record.id)).toBe(false); }
    const persisted = await s.getTask(record.record.id); expect(persisted.ok && persisted.record.status).toBe("completed");
    if (persisted.ok) expect(persisted.record.sourceMeetingId).toBe(record.record.sourceMeetingId);
    expect((await s.updateTask(record.record.id, record.record)).ok).toBe(true);
  });
  it("T-08 allows both backend roles and denies anonymous and authenticated non-backend sessions in service and RLS", async () => {
    for (const db of [committee, authorised]) expect((await service(db).getTask(fixture.tasks[0].id)).ok).toBe(true);
    for (const db of [anonymous, outsider]) {
      expect(await service(db).listTasks()).toMatchObject({ ok: false, code: "PERMISSION_DENIED" });
      const read = await db.from("tasks").select("id").eq("id", fixture.tasks[0].id);
      expect(read.error !== null || read.data?.length === 0).toBe(true);
      const write = await db.from("tasks").update({ status: "completed" }).eq("id", fixture.tasks[0].id).select("id");
      expect(write.error !== null || write.data?.length === 0).toBe(true);
    }
  });
});
