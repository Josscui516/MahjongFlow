import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import { PreparationPanel } from "./PreparationPanel";

const task: TaskRecordDTO = { assigneeId: "11111111-1111-4111-8111-111111111111", createdAt: "2026-09-01T00:00:00Z", createdBy: "11111111-1111-4111-8111-111111111111", description: "Fictional", dueDate: "2026-09-20", eventId: "22222222-2222-4222-8222-222222222222", id: "33333333-3333-4333-8333-333333333333", sourceDecisionId: null, sourceDiscussionPointId: null, sourceMeetingId: null, status: "completed", title: "Prepare fictional venue", updatedAt: "2026-09-01T00:00:00Z" };

describe("PreparationPanel", () => {
  it("renders progress, linked tasks, and unlink controls", () => {
    const html = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 1, total: 1 }, tasks: [task] } }}/>)
    expect(html).toContain("1/1");
    expect(html).not.toContain("Completed 1 of 1");
    expect(html).toContain("View task");
    expect(html).toContain("The task will be kept.");
    expect(html).toContain("Prepare fictional venue");
    expect(html).toContain("Unlink");
    expect(html).toContain(`href="/tasks/${task.id}"`);
  });

  it("requires an explicit candidate selection before adding a task", () => {
    const html = renderToStaticMarkup(<PreparationPanel candidates={[{ ...task, eventId: null }]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 0, total: 0 }, tasks: [] } }}/>);
    expect(html).toContain('type="hidden" name="taskId" value=""');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('disabled="" aria-busy="false"');
    expect(html).toContain("Search tasks by name");
    expect(html).toContain("Add to event");
  });

  it("distinguishes empty, permission, and system-error states", () => {
    const empty = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ ok: true, snapshot: { eventId: task.eventId!, progress: { completed: 0, total: 0 }, tasks: [] } }}/>)
    const denied = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ code: "PERMISSION_DENIED", ok: false }}/>)
    const failed = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ code: "SYSTEM_ERROR", ok: false }}/>)
    expect(empty).not.toContain("0/0"); expect(empty).not.toContain("Completed 0 of 0"); expect(empty).toContain("No preparation tasks yet"); expect(empty).toContain("Link your first task");
    expect(denied).toContain("do not have permission"); expect(failed).toContain("could not be loaded");
  });
});

it("puts unfinished work before completed tasks without losing unlink access", () => {
  const html = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ok:true,snapshot:{eventId:task.eventId!,progress:{completed:1,total:2},tasks:[task,{...task,id:"44444444-4444-4444-8444-444444444444",title:"Outstanding fictional work",status:"not_started"}]}}} />);
  expect(html.indexOf("Outstanding fictional work")).toBeLessThan(html.indexOf("<details"));
  expect(html.indexOf(task.title)).toBeGreaterThan(html.indexOf("<details"));
  expect(html).toContain(`Unlink ${task.title} from event`);
  expect(html).toContain("20 Sept 2026");
});

it("highlights only unfinished tasks before the Sydney calendar day", () => {
  const tasks = [task, {...task, id: "old", status: "not_started" as const}, {...task, id: "today", status: "in_progress" as const, dueDate: "2026-09-21"}];
  const html = renderToStaticMarkup(<PreparationPanel now={new Date("2026-09-20T14:00:00Z")} candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ok:true,snapshot:{eventId:task.eventId!,progress:{completed:1,total:3},tasks}}} />);
  expect(html).toContain("1 overdue task");
  expect(html.match(/data-due-risk="overdue"/g)).toHaveLength(1);
  expect(html).toContain("Overdue 1 day");
});

it("keeps five earliest unfinished tasks visible and preserves totals and all remaining work", () => {
  const tasks = Array.from({length: 8}, (_, i) => ({ ...task, id: `pending-${i}`, title: `Pending work ${i}`, status: "not_started" as const, dueDate: `2026-10-${String(28-i).padStart(2,"0")}` }));
  const originalOrder = tasks.map(item => item.id);
  const html = renderToStaticMarkup(<PreparationPanel candidates={[{...task, eventId:null}]} eventId={task.eventId!} linkAction={async () => {}} now={new Date("2026-10-21T00:00:00Z")} result={{ok:true,snapshot:{eventId:task.eventId!,progress:{completed:1,total:9},tasks:[...tasks,task]}}} />);
  const firstDisclosure = html.indexOf("<details");
  expect(html.slice(0,firstDisclosure).match(/<h3 /g)).toHaveLength(5);
  expect(html.indexOf("Pending work 7")).toBeLessThan(html.indexOf("Pending work 6"));
  expect(html.indexOf("Pending work 2")).toBeGreaterThan(firstDisclosure);
  expect(html).toContain("Show all 8 tasks");
  expect(html).toContain("Show fewer tasks");
  expect(html).toContain("1/9");
  expect(html).toContain("Completed tasks (1)");
  expect(html.indexOf('role="combobox"')).toBeLessThan(html.indexOf("Pending work 7"));
  expect(tasks.map(item => item.id)).toEqual(originalOrder);
});
it("does not offer expansion when five unfinished tasks fit", () => {
  const tasks = Array.from({length:5},(_,i)=>({...task,id:`pending-${i}`,status:"not_started" as const}));
  const html = renderToStaticMarkup(<PreparationPanel candidates={[]} eventId={task.eventId!} linkAction={async () => {}} result={{ok:true,snapshot:{eventId:task.eventId!,progress:{completed:0,total:5},tasks}}} />);
  expect(html).not.toContain("Show all");
  expect(html.match(/<h3 /g)).toHaveLength(5);
});
