import { describe, expect, it } from "vitest";
import { buildTaskListHref, parseTaskFilterCriteria } from "./search-params";

describe("Sprint 5 task filter contract", () => {
  it("round-trips every filter through the task URL", () => {
    const parsed = parseTaskFilterCriteria({ assigneeId: "11111111-1111-4111-8111-111111111111", dueFrom: "2026-09-01", dueTo: "2026-09-08", eventId: "22222222-2222-4222-8222-222222222222", q: " venue ", sort: "updated_recent", status: "in_progress" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.criteria).toMatchObject({ page: 1, pageSize: 10 });
      expect(buildTaskListHref(parsed.criteria, 3)).toBe("/tasks?q=venue&assigneeId=11111111-1111-4111-8111-111111111111&status=in_progress&dueFrom=2026-09-01&dueTo=2026-09-08&eventId=22222222-2222-4222-8222-222222222222&sort=updated_recent&page=3");
    }
  });

  it.each([
    [{ assigneeId: "not-a-user" }, "Select a valid assignee."],
    [{ eventId: "not-an-event" }, "Enter a valid event identifier."],
    [{ dueFrom: "2026-02-30" }, "Enter a valid start date."],
    [{ dueFrom: "2026-09-09", dueTo: "2026-09-08" }, "The start date must be on or before the end date."],
    [{ status: "overdue" }, "Select a valid task status."],
    [{ page: "0" }, "Select a valid task page."],
    [{ page: "2.5" }, "Select a valid task page."],
  ])("rejects unsafe filter input %#", (params, message) => {
    const parsed = parseTaskFilterCriteria(params);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors).toContain(message);
  });
});
