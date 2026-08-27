import { describe, expect, test } from "vitest";
import type { TaskRecordDTO } from "../core/contracts";
import { filterAndSortTasks } from "./projection";

const base = { assigneeId: "11111111-1111-4111-8111-111111111111", createdAt: "2026-08-20T00:00:00Z", createdBy: "11111111-1111-4111-8111-111111111111", description: "Prepare the fictional venue plan.", status: "not_started" as const, updatedAt: "2026-08-20T00:00:00Z" };
const items: readonly TaskRecordDTO[] = [
  { ...base, dueDate: "2026-09-02", id: "22222222-2222-4222-8222-222222222222", title: "Venue plan" },
  { ...base, description: "Confirm the sample supplier.", dueDate: "2026-08-29", id: "33333333-3333-4333-8333-333333333333", status: "completed", title: "Supplier follow-up", updatedAt: "2026-08-26T00:00:00Z" },
];

describe("task list projection", () => {
  test("searches title and description and filters status", () => {
    expect(filterAndSortTasks(items, { search: "sample", sort: "due_soonest", status: "completed" }).map((item) => item.title)).toEqual(["Supplier follow-up"]);
  });
  test("sorts by due date or most recent update", () => {
    expect(filterAndSortTasks(items, { search: "", sort: "due_soonest", status: "all" }).map((item) => item.title)).toEqual(["Supplier follow-up", "Venue plan"]);
    expect(filterAndSortTasks(items, { search: "", sort: "updated_recent", status: "all" }).map((item) => item.title)).toEqual(["Supplier follow-up", "Venue plan"]);
  });
});
