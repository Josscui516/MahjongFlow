import { describe, expect, it, vi } from "vitest";

import type { TaskRecordDTO, TaskStatus } from "@/features/tasks/core/contracts";

import { createDashboardTaskQuery, type DashboardTaskQueryDependencies } from "./task-query-adapter";

function task(id: string, status: TaskStatus, dueDate: string, assigneeId = "fictional-user"): TaskRecordDTO {
  return {
    assigneeId,
    createdAt: "2026-09-01T00:00:00.000Z",
    createdBy: "fictional-creator",
    description: "Fictional task",
    dueDate,
    eventId: null,
    id,
    sourceDecisionId: null,
    sourceDiscussionPointId: null,
    sourceMeetingId: null,
    status,
    title: `Task ${id}`,
    updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

describe("createDashboardTaskQuery", () => {
  it("combines both unfinished statuses through the shared provider", async () => {
    const listTasks = vi.fn<DashboardTaskQueryDependencies["listTasks"]>(async ({ status }) => {
      const items = status === "not_started" ? [task("b", status, "2026-09-11")] : [task("a", status, "2026-09-10")];
      return { items, ok: true as const, total: items.length };
    });
    const query = createDashboardTaskQuery({ classifyDueRisk: vi.fn<DashboardTaskQueryDependencies["classifyDueRisk"]>(() => ({ ok: true, value: "normal" })), listTasks });
    const result = await query.querySection({ key: "mine", now: new Date("2026-09-10T00:00:00Z"), userId: "fictional-user" });
    expect(result.ok && result.section.items.map(({ id }) => id)).toEqual(["a", "b"]);
    expect(listTasks).toHaveBeenCalledTimes(2);
    expect(listTasks.mock.calls.every(([criteria]) => criteria.assigneeId === "fictional-user")).toBe(true);
    expect(listTasks.mock.calls.every(([criteria]) => criteria.page === 1 && criteria.pageSize === 100)).toBe(true);
  });

  it("loads every provider page before calculating dashboard totals", async () => {
    const listTasks = vi.fn<DashboardTaskQueryDependencies["listTasks"]>(async ({ page, status }) => {
      if (status === "in_progress") return { items: [], ok: true, total: 0 };
      return { items: [task(`page-${page}`, status, `2026-09-${String(page).padStart(2, "0")}`)], ok: true, total: 201 };
    });
    const query = createDashboardTaskQuery({ classifyDueRisk: () => ({ ok: true, value: "normal" }), listTasks });
    const result = await query.querySection({ key: "unfinished", now: new Date("2026-09-10T00:00:00Z"), userId: "fictional-user" });
    expect(result.ok && result.section.items.map(({ id }) => id)).toEqual(["page-1", "page-2", "page-3"]);
    expect(listTasks.mock.calls.filter(([criteria]) => criteria.status === "not_started").map(([criteria]) => criteria.page)).toEqual([1, 2, 3]);
  });

  it("delegates due-risk decisions to the shared classifier", async () => {
    const dueSoon = task("due-soon", "not_started", "2026-09-12");
    const overdue = task("overdue", "in_progress", "2026-09-09");
    const listTasks = vi.fn<DashboardTaskQueryDependencies["listTasks"]>(async ({ status }) => ({ items: status === "not_started" ? [dueSoon] : [overdue], ok: true as const, total: 1 }));
    const classifyDueRisk = vi.fn<DashboardTaskQueryDependencies["classifyDueRisk"]>(({ dueDate }) => ({ ok: true as const, value: dueDate === "2026-09-12" ? "dueSoon" as const : "overdue" as const }));
    const query = createDashboardTaskQuery({ classifyDueRisk, listTasks });
    const result = await query.querySection({ key: "dueSoon", now: new Date("2026-09-10T00:00:00Z"), userId: "fictional-user" });
    expect(result.ok && result.section.items.map(({ id }) => id)).toEqual(["due-soon"]);
    expect(classifyDueRisk).toHaveBeenCalledTimes(2);
  });

  it("preserves permission failures instead of displaying an empty count", async () => {
    const query = createDashboardTaskQuery({
      classifyDueRisk: vi.fn<DashboardTaskQueryDependencies["classifyDueRisk"]>(() => ({ ok: true, value: "normal" })),
      listTasks: vi.fn(async () => ({ code: "PERMISSION_DENIED" as const, ok: false as const })),
    });
    await expect(query.querySection({ key: "unfinished", now: new Date("2026-09-10T00:00:00Z"), userId: "fictional-user" })).resolves.toEqual({ code: "PERMISSION_DENIED", key: "unfinished", ok: false });
  });

  it("reports invalid due-risk input instead of silently displaying zero", async () => {
    const query = createDashboardTaskQuery({
      classifyDueRisk: () => ({ ok: false, value: "invalid" }),
      listTasks: async () => ({ ok: true, total: 1, items: [task("invalid", "not_started", "invalid")] }),
    });
    await expect(query.querySection({ key: "overdue", now: new Date("2026-09-10T00:00:00Z"), userId: "fictional-user" })).resolves.toEqual({ ok: false, code: "SYSTEM_ERROR", key: "overdue" });
  });
});
