import { describe, expect, test } from "vitest";
import type { TaskInput } from "./contracts";
import { validateTaskInput } from "./validation";
const valid: TaskInput = { assigneeId: "11111111-1111-4111-8111-111111111111", description: "Fictional follow-up.", dueDate: "2026-08-31", status: "not_started", title: "Prepare fictional report" };
describe("task validation", () => {
  test("supports independent meeting associations without inventing a decision source", () => {
    expect(validateTaskInput({ ...valid, meetingIds: [valid.assigneeId, valid.assigneeId] })).toMatchObject({ ok: true, value: { meetingIds: [valid.assigneeId] } });
    expect(validateTaskInput({ ...valid, meetingIds: [] })).toMatchObject({ ok: true, value: { meetingIds: [] } });
  });
  test.each([["invalid"], Array(101).fill(valid.assigneeId), "not-an-array", [null]])("rejects malformed or oversized meeting selections", meetingIds => {
    expect(validateTaskInput({ ...valid, meetingIds: meetingIds as never })).toMatchObject({ ok: false, errors: [{ field: "meetingIds" }] });
  });
  test.each(["not_started", "in_progress", "completed"] as const)("T-02 accepts %s", (status) => expect(validateTaskInput({ ...valid, status })).toMatchObject({ ok: true, value: { status } }));
  test("T-02 rejects unknown persisted status", () => expect(validateTaskInput({ ...valid, status: "overdue" as TaskInput["status"] })).toMatchObject({ ok: false, errors: [{ field: "status" }] }));
  test("requires a meeting for source children and rejects two sources", () => expect(validateTaskInput({ ...valid, sourceDecisionId: valid.assigneeId, sourceDiscussionPointId: valid.assigneeId })).toMatchObject({ ok: false }));
});
