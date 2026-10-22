"use client";

import { useState } from "react";
import Link from "next/link";
import { taskDateLabel } from "@/features/tasks/presentation";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { DueRiskReminder } from "@/features/tasks/reminders";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";

export type DashboardTask = Pick<TaskRecordDTO, "id" | "title" | "dueDate" | "status">;

export function DashboardTaskRows({ items, capturedAt }: Readonly<{ items: readonly DashboardTask[]; capturedAt: string }>) {
  const now = new Date(capturedAt);
  return <ul className="divide-y divide-slate-100">{items.map(task => <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3" key={task.id}>
    <Link className="min-w-0 flex-1 break-words rounded-sm py-1 text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/tasks/${encodeURIComponent(task.id)}`}>{task.title}</Link>
    <div className="shrink-0 text-xs text-slate-600"><time dateTime={task.dueDate}>{taskDateLabel(task.dueDate)}</time><DueRiskReminder compact dueDate={task.dueDate} now={now} risk={classifyTaskDueRisk({ ...task, now })} taskTitle={task.title} /></div>
  </li>)}</ul>;
}

export function MoreDashboardTasks({ items, capturedAt }: Readonly<{ items: readonly DashboardTask[]; capturedAt: string }>) {
  const [open, setOpen] = useState(false);
  return <details className="group border-t border-slate-200" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer rounded-md py-3 text-sm font-semibold text-emerald-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"><span className="group-open:hidden">Show {items.length} more tasks</span><span className="hidden group-open:inline">Show fewer tasks</span></summary>
    {open ? <DashboardTaskRows items={items} capturedAt={capturedAt} /> : null}
  </details>;
}
