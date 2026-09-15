"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";

import { FormErrorSummary } from "@/components/forms/FormErrorSummary";
import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";

import type {
  TaskAssigneeOption,
  TaskConversionAction,
  TaskConversionField,
  TaskConversionFieldError,
  TaskConversionFormState,
  TaskConversionFormValues,
  TaskSourceContext,
} from "./contracts";
import { TASK_STATUSES } from "./contracts";
import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from "./validation";

const FIELD_IDS: Record<TaskConversionField, string> = {
  assigneeId: "task-conversion-assigneeId",
  description: "task-conversion-description",
  dueDate: "task-conversion-dueDate",
  status: "task-conversion-status",
  title: "task-conversion-title",
};

const STATUS_LABELS = {
  completed: "Completed",
  in_progress: "In progress",
  not_started: "Not started",
} as const;

type TaskConversionFormProps = Readonly<{
  assigneeOptions: readonly TaskAssigneeOption[];
  conversionAction: TaskConversionAction;
  initialState?: TaskConversionFormState;
  initialValues: TaskConversionFormValues;
  sourceContext: TaskSourceContext;
  sourceLabel: string;
}>;

function fieldError(
  errors: readonly TaskConversionFieldError[],
  field: TaskConversionField,
): string | undefined {
  return errors.find((item) => item.field === field)?.message;
}

function SubmissionFeedback({ state }: Readonly<{ state: TaskConversionFormState }>) {
  if (state.status === "idle" || state.status === "validation") return null;

  const feedback = {
    duplicate: {
      description:
        "A task has already been created from this source. Open the existing task instead of submitting again.",
      role: "status" as const,
      title: "Task already exists",
    },
    permission: {
      description: "You do not have permission to create this task.",
      role: "alert" as const,
      title: "Access required",
    },
    success: {
      description: "The task and its source link were saved.",
      role: "status" as const,
      title: "Task created",
    },
    "system-error": {
      description:
        "The task could not be created. Your fields and source are still here; try again.",
      role: "alert" as const,
      title: "Something went wrong",
    },
  }[state.status];

  return (
    <section
      aria-live="polite"
      className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-slate-950"
      role={feedback.role}
    >
      <h2 className="font-semibold">{feedback.title}</h2>
      <p className="mt-1 text-sm leading-5">{feedback.description}</p>
      {state.status === "success" && state.taskId ? (
        <Link className="mt-3 inline-flex min-h-11 items-center font-semibold text-emerald-900 underline underline-offset-4" href={`/tasks/${encodeURIComponent(state.taskId)}`}>Open created task</Link>
      ) : null}
    </section>
  );
}

export function TaskConversionForm({
  assigneeOptions,
  conversionAction,
  initialState,
  initialValues,
  sourceContext,
  sourceLabel,
}: TaskConversionFormProps) {
  const initialActionState: TaskConversionFormState = initialState ?? {
    errors: [],
    sourceContext,
    status: "idle",
    values: initialValues,
  };
  const [state, formAction, pending] = useActionState(
    conversionAction,
    initialActionState,
  );
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const hasAssignees = assigneeOptions.length > 0;

  useEffect(() => {
    if (state.status === "validation") {
      errorSummaryRef.current
        ?.querySelector<HTMLElement>("[tabindex='-1']")
        ?.focus();
    }
  }, [state.status]);

  const summaryErrors = state.errors.map((item) => ({
    fieldId: FIELD_IDS[item.field],
    label: item.label,
    message: item.message,
  }));

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div ref={errorSummaryRef}>
        <FormErrorSummary
          errors={summaryErrors}
          title="Fix the following before creating the task"
        />
      </div>
      <SubmissionFeedback state={state} />

      <section
        aria-labelledby="task-conversion-source-heading"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
      >
        <h2
          className="text-sm font-semibold text-emerald-950"
          id="task-conversion-source-heading"
        >
          Task source
        </h2>
        <p className="mt-1 text-sm leading-5 text-emerald-900">{sourceLabel}</p>
        <p className="mt-1 text-xs text-emerald-800">
          This trusted source is kept if validation or saving fails.
        </p>
      </section>

      <section
        aria-labelledby="task-conversion-fields-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div>
          <h2
            className="text-lg font-bold tracking-tight text-slate-950"
            id="task-conversion-fields-heading"
          >
            Task details
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Every converted task needs one accountable committee member and a due date.
          </p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <FormField
            control={
              <input
                autoComplete="off"
                defaultValue={state.values.title}
                disabled={pending}
                maxLength={TASK_TITLE_MAX_LENGTH}
                name="title"
              />
            }
            description="Use a concise action-oriented title."
            error={fieldError(state.errors, "title")}
            id={FIELD_IDS.title}
            label="Task title"
            required
          />
          <FormField
            control={
              <select
                key={state.values.assigneeId}
                defaultValue={state.values.assigneeId}
                disabled={pending || !hasAssignees}
                name="assigneeId"
              >
                <option value="">Choose one committee member</option>
                {assigneeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            }
            description="Only one primary assignee can be selected."
            error={fieldError(state.errors, "assigneeId")}
            id={FIELD_IDS.assigneeId}
            label="Primary assignee"
            required
          />
          <FormField
            control={
              <input
                defaultValue={state.values.dueDate}
                disabled={pending}
                name="dueDate"
                type="date"
              />
            }
            description="The date is interpreted in Australia/Sydney."
            error={fieldError(state.errors, "dueDate")}
            id={FIELD_IDS.dueDate}
            label="Due date"
            required
          />
          <FormField
            control={
              <select
                key={state.values.status}
                defaultValue={state.values.status}
                disabled={pending}
                name="status"
              >
                <option value="">Choose a status</option>
                {TASK_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            }
            description="Overdue is derived from the due date; it is not a saved status."
            error={fieldError(state.errors, "status")}
            id={FIELD_IDS.status}
            label="Status"
            required
          />
        </div>

        <div className="mt-5">
          <FormField
            control={
              <textarea
                className="min-h-36 resize-y"
                defaultValue={state.values.description}
                disabled={pending}
                maxLength={TASK_DESCRIPTION_MAX_LENGTH}
                name="description"
              />
            }
            description="Keep enough decision context for the assignee to act."
            error={fieldError(state.errors, "description")}
            id={FIELD_IDS.description}
            label="Description"
            required
          />
        </div>
      </section>

      {!hasAssignees ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-950"
          role="status"
        >
          No committee profiles are available. Ask an administrator to add a profile before creating this task.
        </p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton
          disabled={!hasAssignees || state.status === "success"}
          pending={pending}
          pendingLabel="Creating task…"
        >
          Create task
        </SubmitButton>
      </div>
    </form>
  );
}
