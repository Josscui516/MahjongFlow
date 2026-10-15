import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
import { TaskEditor } from "./TaskEditor";
import { validateTaskInput } from "../core/validation";
import type { TaskRecordDTO } from "../core/contracts";

it("shows multiple selected meetings and keeps the original source visibly locked", () => {
  const sourceId = "11111111-1111-4111-8111-111111111111", otherId = "22222222-2222-4222-8222-222222222222";
  const record: TaskRecordDTO = { id: "33333333-3333-4333-8333-333333333333", assigneeId: sourceId, createdBy: sourceId, createdAt: "2026-10-15T00:00:00Z", updatedAt: "2026-10-15T00:00:00Z", title: "Fictional linked task", description: "Fictional follow-up", dueDate: "2026-11-01", status: "not_started", sourceMeetingId: sourceId, meetingIds: [sourceId, otherId] };
  const html = renderToStaticMarkup(<TaskEditor assignees={[]} initialRecord={record} meetingOptions={[{ id: sourceId, label: "Fictional source meeting" }, { id: otherId, label: "Fictional follow-up meeting" }]} createTaskAction={vi.fn()} updateTaskAction={vi.fn()} />);
  expect(html).toContain("Related meetings (optional)");
  expect(html.match(/name="meetingIds"/g)).toHaveLength(2);
  expect(html.match(/checked=""/g)).toHaveLength(2);
  expect(html).toContain("Original source · always linked");
  expect(html).toContain(`value="${sourceId}"`);
});

it("requires an explicit assignee instead of silently choosing the first member", () => {
  const html = renderToStaticMarkup(<TaskEditor assignees={[{id:"11111111-1111-4111-8111-111111111111", label:"Fictional first member"}]} createTaskAction={vi.fn()} updateTaskAction={vi.fn()} />);
  expect(html).toContain('<option value="" disabled="" selected="">Choose an assignee</option>');
  expect(html).not.toContain('<option value="11111111-1111-4111-8111-111111111111" selected=""');
  expect(validateTaskInput({title:"Fictional task",description:"Prepare room",assigneeId:"",dueDate:"2026-10-01",status:"not_started"})).toMatchObject({ok:false,errors:[{field:"assigneeId"}]});
});
