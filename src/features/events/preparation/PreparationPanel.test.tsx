import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import { PreparationPanel } from "./PreparationPanel";

const task: TaskRecordDTO = { assigneeId: "11111111-1111-4111-8111-111111111111", createdAt: "2026-09-01T00:00:00Z", createdBy: "11111111-1111-4111-8111-111111111111", description: "Fictional", dueDate: "2026-09-20", eventId: "22222222-2222-4222-8222-222222222222", id: "33333333-3333-4333-8333-333333333333", sourceDecisionId: null, sourceDiscussionPointId: null, sourceMeetingId: null, status: "completed", title: "Prepare fictional venue", updatedAt: "2026-09-01T00:00:00Z" };

describe("PreparationPanel", () => {
  it("renders progress, linked tasks, and unlink controls", () => {
    const html = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 1, total: 1 }, tasks: [task] } }}/>)
    expect(html).toContain("1/1");
    expect(html).toContain("Prepare fictional venue");
    expect(html).toContain("Unlink");
  });

  it("distinguishes empty, permission, and system-error states", () => {
    const empty = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 0, total: 0 }, tasks: [] } }}/>)
    const denied = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ code: "PERMISSION_DENIED", ok: false }}/>)
    const failed = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ code: "SYSTEM_ERROR", ok: false }}/>)
    expect(empty).toContain("0/0"); expect(empty).toContain("No preparation tasks");
    expect(denied).toContain("do not have permission"); expect(failed).toContain("could not be loaded");
  });
});

