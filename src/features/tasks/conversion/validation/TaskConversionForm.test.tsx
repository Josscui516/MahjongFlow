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
