import Link from "next/link";
import {TASK_STATUS_LABELS} from "../presentation";

import type { RelatedTasksResult, SourceKindView } from "./contracts";
import {
  SourceNavigationEmpty,
  SourceNavigationLoading,
  SourceNavigationSystemError,
  SourceNavigationUnavailable,
} from "./NavigationFeedback";
import { getSourceKindLabel, getTaskHref } from "./presentation";

export type RelatedTasksPanelProps = Readonly<{
  result: RelatedTasksResult;
  agendaItems?: readonly Readonly<{ id: string; kind: SourceKindView }>[];
}>;

export function RelatedTasksPanelLoading() {
  return <SourceNavigationLoading subject="related tasks" />;
}

export function RelatedTasksPanel({ result, agendaItems = [] }: RelatedTasksPanelProps) {
  if (!result.ok) {
    return result.code === "UNAVAILABLE" ? (
      <SourceNavigationUnavailable />
    ) : (
      <SourceNavigationSystemError />
    );
  }

  if (result.items.length === 0) {
    return <SourceNavigationEmpty subject="related tasks" />;
  }

  return (
    <section
      aria-labelledby="related-tasks-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      data-source-navigation-state="success"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950" id="related-tasks-heading">
            Related tasks
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            All tasks linked to this meeting, with their current status.
          </p>
        </div>
        <p className="text-sm font-semibold text-emerald-800">
          {result.items.length} {result.items.length === 1 ? "task" : "tasks"}
        </p>
      </div>

      <ul className="mt-5 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200">
        {result.items.map((task) => {
          const agendaIndex = agendaItems.findIndex(item => item.id === task.sourceId && item.kind === task.sourceKind);
          const sourceLabel = agendaIndex >= 0 ? `Agenda item ${agendaIndex + 1}` : task.sourceKind ? getSourceKindLabel() : "Linked meeting";
          return (
          <li className="min-w-0 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4" key={task.id}>
            <div className="min-w-0">
              <p className="break-words font-semibold text-slate-950">{task.title}</p>
              <p className="mt-1 text-sm text-slate-600">{sourceLabel}{task.status ? ` · ${TASK_STATUS_LABELS[task.status]}` : ""}</p>
            </div>
            <Link
              aria-label={agendaIndex >= 0 ? `Open task ${task.title} from agenda item ${agendaIndex + 1}` : task.sourceKind ? `Open task ${task.title} from this meeting agenda` : `Open task ${task.title} linked to this meeting`}
              className="mt-3 inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:mt-0"
              href={getTaskHref(task.id)}
            >
              Open task
            </Link>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
