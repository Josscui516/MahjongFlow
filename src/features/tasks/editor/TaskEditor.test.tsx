import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
import { TaskEditor } from "./TaskEditor";
import { validateTaskInput } from "../core/validation";

it("requires an explicit assignee instead of silently choosing the first member", () => {
  const html = renderToStaticMarkup(<TaskEditor assignees={[{id:"11111111-1111-4111-8111-111111111111", label:"Fictional first member"}]} createTaskAction={vi.fn()} updateTaskAction={vi.fn()} />);
  expect(html).toContain('<option value="" disabled="" selected="">Choose an assignee</option>');
  expect(html).not.toContain('<option value="11111111-1111-4111-8111-111111111111" selected=""');
  expect(validateTaskInput({title:"Fictional task",description:"Prepare room",assigneeId:"",dueDate:"2026-10-01",status:"not_started"})).toMatchObject({ok:false,errors:[{field:"assigneeId"}]});
});
