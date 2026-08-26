"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { TASK_STATUSES, type TaskStatus } from "../../core/contracts";
import { validateTaskInput } from "../../core/validation";
import type { AssigneeOption } from "../../editor/server";
import { convertTaskSourceAction } from "./actions";
import type { TaskConversionCreateInput, TaskSourceKind } from "./contracts";

const statusLabels: Record<TaskStatus, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

export function TaskConversionForm({
  assignees,
  sourceId,
  sourceKind,
}: Readonly<{
  assignees: readonly AssigneeOption[];
  sourceId: string;
  sourceKind: TaskSourceKind;
}>) {
  const router = useRouter();
  const [input, setInput] = useState<TaskConversionCreateInput>({
    assigneeId: assignees[0]?.id ?? "",
    description: "",
    dueDate: "",
    status: "not_started",
    title: "",
  });
  const [message, setMessage] = useState(assignees.length ? "" : "No active assignee is available.");
  const [pending, setPending] = useState(false);

  const set = <Key extends keyof TaskConversionCreateInput>(
    key: Key,
    value: TaskConversionCreateInput[Key],
  ) => setInput((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const validation = validateTaskInput(input);
    if (!validation.ok) {
      setMessage(validation.errors.map((error) => error.message).join(" "));
      return;
    }

    setPending(true);
    try {
      const result = await convertTaskSourceAction(sourceKind, sourceId, {
        assigneeId: validation.value.assigneeId,
        description: validation.value.description,
        dueDate: validation.value.dueDate,
        status: validation.value.status,
        title: validation.value.title,
      });

      if (!result.ok) {
        setMessage(
          result.code === "validation"
            ? (result.errors ?? []).map((error) => error.message).join(" ")
            : result.message,
        );
        return;
      }

      router.push(`/tasks/${result.taskId}?saved=1`);
      router.refresh();
    } catch {
      setMessage("Unable to create the task. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      aria-busy={pending}
      className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
      noValidate
      onSubmit={submit}
    >
      <h2 className="text-xl font-semibold text-slate-950">Task details</h2>
      {message ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">
          {message}
        </p>
      ) : null}
      <label className="block text-sm font-semibold" htmlFor="conversion-title">
        Title
        <input
          className="mt-2 w-full rounded-xl border border-slate-300 p-3"
          disabled={pending}
          id="conversion-title"
          maxLength={200}
          onChange={(event) => set("title", event.target.value)}
          required
          value={input.title}
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="conversion-description">
        Description
        <textarea
          className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3"
          disabled={pending}
          id="conversion-description"
          maxLength={10_000}
          onChange={(event) => set("description", event.target.value)}
          required
          value={input.description}
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="text-sm font-semibold" htmlFor="conversion-assignee">
          Assignee
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            disabled={pending || !assignees.length}
            id="conversion-assignee"
            onChange={(event) => set("assigneeId", event.target.value)}
            value={input.assigneeId}
          >
            {assignees.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold" htmlFor="conversion-due-date">
          Due date
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            disabled={pending}
            id="conversion-due-date"
            onChange={(event) => set("dueDate", event.target.value)}
            required
            type="date"
            value={input.dueDate}
          />
        </label>
        <label className="text-sm font-semibold" htmlFor="conversion-status">
          Status
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 p-3"
            disabled={pending}
            id="conversion-status"
            onChange={(event) => set("status", event.target.value as TaskStatus)}
            value={input.status}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </label>
      </div>
      <button
        className="rounded-xl bg-emerald-950 px-5 py-3 font-semibold text-white disabled:opacity-50"
        disabled={pending || !assignees.length}
        type="submit"
      >
        {pending ? "Creating task…" : "Create linked task"}
      </button>
    </form>
  );
}
