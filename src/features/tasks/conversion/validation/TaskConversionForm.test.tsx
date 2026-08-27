/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  TaskConversionAction,
  TaskConversionFieldError,
  TaskConversionFormState,
  TaskConversionSubmissionStatus,
} from "./contracts";
import {
  FIXTURE_ASSIGNEES,
  FIXTURE_SOURCE_CONTEXT,
  FIXTURE_TASK_VALUES,
} from "./fixtures";
import { TaskConversionForm } from "./TaskConversionForm";

const ACTION: TaskConversionAction = async (state) => state;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function formState(
  status: TaskConversionSubmissionStatus,
  errors: readonly TaskConversionFieldError[] = [],
): TaskConversionFormState {
  return {
    errors,
    sourceContext: FIXTURE_SOURCE_CONTEXT,
    status,
    taskId: status === "success" ? "77777777-7777-4777-8777-777777777777" : undefined,
    values: FIXTURE_TASK_VALUES,
  };
}

function renderForm(
  conversionAction: TaskConversionAction = ACTION,
  options: Readonly<{
    assignees?: typeof FIXTURE_ASSIGNEES;
    initialState?: TaskConversionFormState;
  }> = {},
) {
  const rendered = render(
    <TaskConversionForm
      assigneeOptions={options.assignees ?? FIXTURE_ASSIGNEES}
      conversionAction={conversionAction}
      initialState={options.initialState}
      initialValues={FIXTURE_TASK_VALUES}
      sourceContext={FIXTURE_SOURCE_CONTEXT}
      sourceLabel="Decision: approve the fictional venue"
    />,
  );
  const form = rendered.container.querySelector("form");

  if (!form) throw new Error("Expected the task conversion form to render.");

  return { ...rendered, form };
}

describe("task conversion form", () => {
  it("renders all C-02 fields with a single-select assignee control", () => {
    const { container } = renderForm();
    const assignee = screen.getByLabelText(/Primary assignee/) as HTMLSelectElement;

    expect(screen.getByLabelText(/Task title/).getAttribute("name")).toBe("title");
    expect(screen.getByLabelText(/Description/).getAttribute("name")).toBe("description");
    expect(assignee.name).toBe("assigneeId");
    expect(assignee.multiple).toBe(false);
    expect(screen.getByLabelText(/Due date/).getAttribute("name")).toBe("dueDate");
    expect(screen.getByLabelText(/Status/).getAttribute("name")).toBe("status");
    expect(screen.getByText("Alex Example")).toBeDefined();
    expect(screen.getByText("Decision: approve the fictional venue")).toBeDefined();
    expect(container.querySelector('[name="meetingId"]')).toBeNull();
    expect(container.querySelector('[name="decisionId"]')).toBeNull();
  });

  it("renders linked validation errors and preserved values", async () => {
    renderForm(ACTION, {
      initialState: formState("validation", [
        {
          code: "DUE_DATE_REQUIRED",
          field: "dueDate",
          label: "Due date",
          message: "Choose a due date.",
        },
      ]),
    });

    const summary = screen.getByRole("alert");
    const title = screen.getByLabelText(/Task title/) as HTMLInputElement;

    await waitFor(() => expect(document.activeElement).toBe(summary));
    expect(summary.tabIndex).toBe(-1);
    expect(screen.getByRole("link", { name: "Due date: Choose a due date." }).getAttribute("href"))
      .toBe("#task-conversion-dueDate");
    expect(title.value).toBe("Confirm fictional venue");
    expect(screen.getByText("Decision: approve the fictional venue")).toBeDefined();
  });

  it("focuses the updated error summary after two consecutive validation submissions", async () => {
    let attempt = 0;
    const action = vi.fn<TaskConversionAction>(async () => {
      attempt += 1;
      return formState("validation", [
        attempt === 1
          ? {
              code: "DUE_DATE_REQUIRED",
              field: "dueDate",
              label: "Due date",
              message: "Choose a due date.",
            }
          : {
              code: "TITLE_REQUIRED",
              field: "title",
              label: "Task title",
              message: "Enter a task title.",
            },
      ]);
    });
    const { form } = renderForm(action);

    fireEvent.submit(form);
    const firstSummary = await screen.findByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(firstSummary));

    const title = screen.getByLabelText(/Task title/) as HTMLInputElement;
    title.focus();
    expect(document.activeElement).toBe(title);

    fireEvent.submit(form);
    await screen.findByRole("link", { name: "Task title: Enter a task title." });
    const secondSummary = screen.getByRole("alert");
    await waitFor(() => expect(document.activeElement).toBe(secondSummary));
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("disables repeated submission while the action is pending", async () => {
    let resolveAction: ((state: TaskConversionFormState) => void) | undefined;
    const action = vi.fn<TaskConversionAction>(
      () => new Promise((resolve) => {
        resolveAction = resolve;
      }),
    );
    renderForm(action);
    const button = screen.getByRole("button", { name: "Create task" }) as HTMLButtonElement;

    fireEvent.click(button);
    await waitFor(() => {
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("data-submit-state")).toBe("pending");
      expect(button.textContent).toBe("Creating task…");
    });

    fireEvent.click(button);
    expect(action).toHaveBeenCalledTimes(1);

    resolveAction?.(formState("success"));
    await screen.findByRole("heading", { name: "Task created" });
  });

  it.each([
    ["duplicate", "Task already exists"],
    ["permission", "Access required"],
    ["system-error", "Something went wrong"],
    ["success", "Task created"],
  ] as const)("renders the %s client transition", async (status, heading) => {
    const action = vi.fn<TaskConversionAction>(async () => formState(status));
    const { form } = renderForm(action);

    fireEvent.submit(form);

    await screen.findByRole("heading", { name: heading });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("blocks submission when no valid assignee option exists", () => {
    renderForm(ACTION, { assignees: [] });

    expect(screen.getByText(/No committee profiles are available/)).toBeDefined();
    expect((screen.getByRole("button", { name: "Create task" }) as HTMLButtonElement).disabled)
      .toBe(true);
  });
});
