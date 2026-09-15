import Link from "next/link";
import type {RelatedTaskSummary} from "@/features/tasks/source-navigation/contracts";
import {TASK_STATUS_LABELS} from "@/features/tasks/presentation";

import type { TaskSourceKind } from "@/features/tasks/conversion/source";

export function TaskConversionEntry({ sourceId, sourceKind, task, unavailable }: Readonly<{
  sourceId: string;
  task?: RelatedTaskSummary;
  unavailable?: boolean;
  sourceKind: TaskSourceKind;
}>) {
  if (unavailable) return <span className="text-sm text-slate-600">Task links unavailable. Refresh to try again.</span>;
  if (task) return <div className="flex flex-wrap items-center gap-2"><Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/tasks/${encodeURIComponent(task.id)}`}>View task: {task.title}</Link>{task.status ? <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{TASK_STATUS_LABELS[task.status]}</span> : null}</div>;
  const label = sourceKind === "decision" ? "Create task from decision" : "Create task from discussion point";
  return (
    <Link
      className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      href={`/tasks/convert/${sourceKind}/${encodeURIComponent(sourceId)}`}
    >
      {label}
    </Link>
  );
}
