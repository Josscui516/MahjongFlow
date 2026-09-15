import Link from "next/link";
import { listTaskEventOptions } from "@/features/tasks/event-link";

import { SuccessFeedback, SystemErrorFeedback } from "@/components/feedback";
import { listTasks } from "@/features/tasks/core/service";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
import { TaskList } from "@/features/tasks/list/TaskList";
import { parseTaskFilterCriteria, type RawTaskSearchParams } from "@/features/tasks/list/search-params";

export default async function TasksPage({ searchParams }: Readonly<{ searchParams: Promise<RawTaskSearchParams & { deleted?: string }> }>) {
  const query = await searchParams;
  const parsed = parseTaskFilterCriteria(query);
  const result = parsed.ok ? await listTasks(parsed.criteria) : null;
  const assignees = result?.ok ? await listAssigneeOptions() : [];
  const events = result?.ok ? await listTaskEventOptions() : null;
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4 sm:items-end">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Track ownership, deadlines and progress.
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
        {!parsed.ok ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900" role="alert"><h2 className="font-semibold">Invalid task filters</h2><ul className="mt-2 list-disc pl-5 text-sm">{parsed.errors.map((error) => <li key={error}>{error}</li>)}</ul><Link className="mt-4 inline-block font-semibold underline underline-offset-4" href="/tasks">Clear filters</Link></section>
        ) : !result?.ok ? (
          <SystemErrorFeedback />
        ) : (
          <TaskList
            eventOptions={events?.ok ? events.items : []}
            assigneeLabels={new Map(
              assignees.map((assignee) => [assignee.id, assignee.label]),
            )}
            criteria={parsed.criteria}
            items={result.items}
            total={result.total}
          />
        )}
      </section>
    </div>
  );
}
