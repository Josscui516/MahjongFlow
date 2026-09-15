import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createTaskRepository } from "./repository";

const row = {
  assignee_id: "11111111-1111-4111-8111-111111111111",
  created_at: "2026-09-01T00:00:00Z",
  created_by: "11111111-1111-4111-8111-111111111111",
  description: "Fictional venue follow-up",
  due_date: "2026-09-08",
  event_id: "22222222-2222-4222-8222-222222222222",
  id: "33333333-3333-4333-8333-333333333333",
  source_decision_id: null,
  source_discussion_point_id: null,
  source_meeting_id: null,
  status: "in_progress",
  title: "Venue plan",
  updated_at: "2026-09-02T00:00:00Z",
};

function queryFixture() {
  const calls: Array<readonly unknown[]> = [];
  const query = {
    eq(column: string, value: string) { calls.push(["eq", column, value]); return this; },
    gte(column: string, value: string) { calls.push(["gte", column, value]); return this; },
    lte(column: string, value: string) { calls.push(["lte", column, value]); return this; },
    or(value: string) { calls.push(["or", value]); return this; },
    order(column: string, options?: unknown) { calls.push(["order", column, options]); return this; },
    range(from: number, to: number) { calls.push(["range", from, to]); return Promise.resolve({ count: 41, data: [row], error: null }); },
  };
  const client = { from: vi.fn(() => ({ select: vi.fn((_columns: string, options: unknown) => { calls.push(["select", options]); return query; }) })) };
  return { calls, client };
}

describe("task follow-up repository query", () => {
  it("updates only mutable fields and preserves database-owned source columns", async () => {
    const update = vi.fn(() => ({ eq: () => ({ select: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }) }));
    const repository = createTaskRepository(async () => ({ from: () => ({ update }) }) as never);
    await repository.update(row.id, { assigneeId: row.assignee_id, description: row.description, dueDate: row.due_date, eventId: row.event_id, status: "completed", title: row.title, sourceMeetingId: "immutable-source" });
    expect(update).toHaveBeenCalledWith({ assignee_id: row.assignee_id, description: row.description, due_date: row.due_date, event_id: row.event_id, status: "completed", title: row.title });
  });
  it("applies every filter with AND semantics before a bounded page and exact total", async () => {
    const fixture = queryFixture();
    const repository = createTaskRepository(async () => fixture.client as never);
    const result = await repository.query!({
      assigneeId: row.assignee_id,
      dueFrom: "2026-09-01",
      dueTo: "2026-09-08",
      eventId: row.event_id,
      page: 2,
      pageSize: 20,
      search: "venue,_(draft)",
      sort: "updated_recent",
      status: "in_progress",
    });

    expect(result).toMatchObject({ total: 41, items: [{ id: row.id }] });
    expect(fixture.calls).toEqual([
      ["select", { count: "exact" }],
      ["eq", "assignee_id", row.assignee_id],
      ["eq", "status", "in_progress"],
      ["gte", "due_date", "2026-09-01"],
      ["lte", "due_date", "2026-09-08"],
      ["eq", "event_id", row.event_id],
      ["or", "title.ilike.%venue \\_ draft %,description.ilike.%venue \\_ draft %"],
      ["order", "updated_at", { ascending: false }],
      ["order", "id", undefined],
      ["range", 20, 39],
    ]);
  });

  it("uses descending due-date order without adding absent filters", async () => {
    const fixture = queryFixture();
    const repository = createTaskRepository(async () => fixture.client as never);
    await repository.query!({ page: 1, pageSize: 20, search: "", sort: "due_latest", status: "all" });
    expect(fixture.calls).toEqual([
      ["select", { count: "exact" }],
      ["order", "due_date", { ascending: false }],
      ["order", "id", undefined],
      ["range", 0, 19],
    ]);
  });
});

it("completes without resending mutable content or immutable source columns", async () => {
 const update=vi.fn(()=>({eq:()=>({select:()=>({maybeSingle:async()=>({data:row,error:null})})})}));
 const repository=createTaskRepository(async()=>({from:()=>({update})}) as never);
 await repository.complete!(row.id);
 expect(update).toHaveBeenCalledWith({status:"completed"});
});
