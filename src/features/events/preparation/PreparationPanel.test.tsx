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
    expect(html).toContain("Remove from event");
    expect(html).toContain(`href="/tasks/${task.id}"`);
  });

  it("requires an explicit candidate selection before adding a task", () => {
    const html = renderToStaticMarkup(<PreparationPanel candidates={[{ ...task, eventId: null }]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 0, total: 0 }, tasks: [] } }}/>);
    expect(html).toContain('name="taskId" required=""');
    expect(html).toContain('<option value="" disabled="" selected="">Choose a task</option>');
    expect(html).toContain("Add to event");
  });

  it("distinguishes empty, permission, and system-error states", () => {
    const empty = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 0, total: 0 }, tasks: [] } }}/>)
    const denied = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ code: "PERMISSION_DENIED", ok: false }}/>)
    const failed = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ code: "SYSTEM_ERROR", ok: false }}/>)
    expect(empty).toContain("0/0"); expect(empty).toContain("No preparation tasks");
    expect(denied).toContain("do not have permission"); expect(failed).toContain("could not be loaded");
  });
});

it("puts unfinished work before completed tasks without losing unlink access", () => {
  const html = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ok:true,snapshot:{eventId:task.eventId!,progress:{completed:1,total:2},tasks:[task,{...task,id:"44444444-4444-4444-8444-444444444444",title:"Outstanding fictional work",status:"not_started"}]}}} />);
  expect(html.indexOf("Outstanding fictional work")).toBeLessThan(html.indexOf("<details"));
  expect(html.indexOf(task.title)).toBeGreaterThan(html.indexOf("<details"));
  expect(html).toContain(`Remove ${task.title} from event`);
  expect(html).toContain("20 Sept 2026");
});
