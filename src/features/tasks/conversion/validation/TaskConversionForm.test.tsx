import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { TaskConversionAction } from "./contracts";
import {
  FIXTURE_ASSIGNEES,
  FIXTURE_SOURCE_CONTEXT,
  FIXTURE_TASK_VALUES,
} from "./fixtures";
import { TaskConversionForm } from "./TaskConversionForm";

const ACTION: TaskConversionAction = async (state) => state;

describe("task conversion form", () => {
  it("orders error links by the visible fields and keeps a cancel route to the source", () => {
    const html = renderToStaticMarkup(<TaskConversionForm assigneeOptions={FIXTURE_ASSIGNEES} conversionAction={ACTION} initialValues={FIXTURE_TASK_VALUES} sourceContext={FIXTURE_SOURCE_CONTEXT} sourceLabel="Fictional agenda" initialState={{status: "validation", sourceContext: FIXTURE_SOURCE_CONTEXT, values: FIXTURE_TASK_VALUES, errors: [
      {field: "description", code: "DESCRIPTION_REQUIRED", label: "Description", message: "Enter a description."},
      {field: "dueDate", code: "DUE_DATE_REQUIRED", label: "Due date", message: "Choose a due date."},
      {field: "assigneeId", code: "ASSIGNEE_REQUIRED", label: "Primary assignee", message: "Choose a member."},
      {field: "title", code: "TITLE_REQUIRED", label: "Task title", message: "Enter a title."},
    ]}} />);
    const links = [...html.matchAll(/href="#task-conversion-([^"]+)"/g)].map(match => match[1]);
    expect(links).toEqual(["title", "assigneeId", "dueDate", "description"]);
    expect(html).toContain(`href="/meetings/${FIXTURE_SOURCE_CONTEXT.meetingId}"`);
    expect(html).toContain("Cancel");
  });
  it("does not show success feedback on the conversion form", () => {
    const html = renderToStaticMarkup(<TaskConversionForm assigneeOptions={FIXTURE_ASSIGNEES} conversionAction={ACTION} initialValues={FIXTURE_TASK_VALUES} sourceContext={FIXTURE_SOURCE_CONTEXT} sourceLabel="Fictional source" initialState={{ errors: [], sourceContext: FIXTURE_SOURCE_CONTEXT, status: "success", taskId: "fictional-task", values: FIXTURE_TASK_VALUES }} />);
    expect(html).not.toContain("Open created task");
    expect(html).not.toContain("Task created");
  });
  it("renders all C-02 fields with a single-select assignee control", () => {
    const html = renderToStaticMarkup(
      <TaskConversionForm
        assigneeOptions={FIXTURE_ASSIGNEES}
        conversionAction={ACTION}
        initialValues={FIXTURE_TASK_VALUES}
        sourceContext={FIXTURE_SOURCE_CONTEXT}
        sourceLabel="Decision: approve the fictional venue"
      />,
    );

    expect(html).toContain('name="title"');
    expect(html).toContain('name="description"');
    expect(html).toContain('name="assigneeId"');
    expect(html).toContain('name="dueDate"');
    expect(html).toContain('name="status"');
    expect(html).toContain("Alex Example");
    expect(html).toContain("Decision: approve the fictional venue");
    expect(html).toContain('value="not_started"');
    expect(html).toContain('value="in_progress"');
    expect(html).toContain('value="completed"');
    expect(html).not.toContain('multiple=""');
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain('name="meetingId"');
    expect(html).not.toContain('name="decisionId"');
  });

  it("renders linked validation errors and preserved values", () => {
    const html = renderToStaticMarkup(
      <TaskConversionForm
        assigneeOptions={FIXTURE_ASSIGNEES}
        conversionAction={ACTION}
        initialState={{
          errors: [
            {
              code: "DUE_DATE_REQUIRED",
              field: "dueDate",
              label: "Due date",
              message: "Choose a due date.",
            },
          ],
          sourceContext: FIXTURE_SOURCE_CONTEXT,
          status: "validation",
          values: { ...FIXTURE_TASK_VALUES, dueDate: "" },
        }}
        initialValues={FIXTURE_TASK_VALUES}
        sourceContext={FIXTURE_SOURCE_CONTEXT}
        sourceLabel="Decision: approve the fictional venue"
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('href="#task-conversion-dueDate"');
    expect(html).toContain('value="Confirm fictional venue"');
    expect(html).toContain("Decision: approve the fictional venue");
  });

  it("blocks submission when no valid assignee option exists", () => {
    const html = renderToStaticMarkup(
      <TaskConversionForm
        assigneeOptions={[]}
        conversionAction={ACTION}
        initialValues={{ ...FIXTURE_TASK_VALUES, assigneeId: "" }}
        sourceContext={FIXTURE_SOURCE_CONTEXT}
        sourceLabel="Discussion point: fictional follow-up"
      />,
    );

    expect(html).toContain("No committee profiles are available");
    expect(html).toContain('disabled=""');
  });
});
