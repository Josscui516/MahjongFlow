import Link from "next/link";

import { SuccessFeedback, SystemErrorFeedback } from "@/components/feedback";
import { listTasks } from "@/features/tasks/core/service";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
import { TaskList } from "@/features/tasks/list/TaskList";
import { parseTaskListCriteria } from "@/features/tasks/list/search-params";

export default async function TasksPage({ searchParams }: Readonly<{ searchParams: Promise<{ deleted?: string; q?: string | string[]; sort?: string | string[]; status?: string | string[] }> }>) {
  const query = await searchParams;
  const criteria = parseTaskListCriteria(query);
  const result = await listTasks();
  const assignees = result.ok ? await listAssigneeOptions() : [];
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Turn committee decisions into owned, dated action items and keep their delivery status visible.
          </p>
        </div>

        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:self-auto"
          href="/tasks/new"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
          Create task
        </Link>
      </header>

      {query.deleted === "1" ? (
        <SuccessFeedback
          message="The task was permanently removed. Its source meeting record, if any, remains available."
          title="Task deleted"
        />
      ) : null}

      <section aria-label="Task list content" className="min-w-0">
        {!result.ok ? (
          <SystemErrorFeedback />
        ) : (
          <TaskList
            assigneeLabels={new Map(
              assignees.map((assignee) => [assignee.id, assignee.label]),
            )}
            criteria={criteria}
            items={result.items}
          />
        )}
      </section>
    </div>
  );
}
