import {taskDateLabel} from "@/features/tasks/presentation";
import Link from "next/link";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { DueRiskReminder } from "@/features/tasks/reminders";

import type {
  DashboardSnapshot,
  DashboardTaskSectionKey,
  DashboardTaskSectionResult,
} from "./contracts";
import { UpcomingEventsPanel, type UpcomingEventsResult } from "./upcoming-events";

const SECTION_COPY: Record<DashboardTaskSectionKey, Readonly<{ empty: string; title: string }>> = {
  mine: { empty: "You have no unfinished tasks.", title: "My unfinished tasks" },
  unfinished: { empty: "There are no unfinished committee tasks.", title: "All unfinished tasks" },
  dueSoon: { empty: "No tasks are due in the next seven days.", title: "Due soon" },
  overdue: { empty: "No tasks are overdue.", title: "Overdue" },
};

const ORDER: DashboardTaskSectionKey[] = ["mine", "overdue", "dueSoon", "unfinished"];
const keyOf = (result: DashboardTaskSectionResult) => result.ok ? result.section.key : result.key;

function TaskRows({ items, now }: Readonly<{ items: readonly TaskRecordDTO[]; now: Date }>) {
  return <ul className="divide-y divide-slate-100">{items.map(task => <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3" key={task.id}>
    <Link className="min-w-0 flex-1 break-words rounded-sm py-1 text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2" href={`/tasks/${encodeURIComponent(task.id)}`}>{task.title}</Link>
    <div className="shrink-0 text-xs text-slate-600"><time dateTime={task.dueDate}>{taskDateLabel(task.dueDate)}</time><DueRiskReminder compact dueDate={task.dueDate} now={now} risk={classifyTaskDueRisk({ ...task, now })} taskTitle={task.title} /></div>
  </li>)}</ul>;
}

function TaskSection({ result, now }: Readonly<{ result: DashboardTaskSectionResult; now: Date }>) {
  const key = keyOf(result);
  const copy = SECTION_COPY[key];
  return <section id={`dashboard-${key}`} aria-labelledby={`heading-${key}`} className="min-w-0 scroll-mt-4 self-start rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
    <h2 id={`heading-${key}`} className="text-lg font-bold text-slate-950">{copy.title}</h2>
    {!result.ok ? <p className="mt-3 text-sm text-rose-900" role="alert">{result.code === "UPSTREAM_NOT_CONNECTED" ? "Task summaries are waiting for the shared task query provider." : result.code === "PERMISSION_DENIED" ? "You do not have permission to view this task summary." : "This task summary could not be loaded."}</p>
    : result.section.items.length === 0 ? <p className="mt-3 text-sm text-slate-600">{copy.empty}</p>
    : <>
      <TaskRows items={result.section.items.slice(0, 3)} now={now} />
      {result.section.items.length > 3 ? <details className="group border-t border-slate-200">
        <summary className="cursor-pointer rounded-md py-3 text-sm font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2"><span className="group-open:hidden">View all {result.section.total} tasks</span><span className="hidden group-open:inline">Show fewer tasks</span></summary>
        <TaskRows items={result.section.items.slice(3)} now={now} />
      </details> : null}
    </>}
  </section>;
}

export function DashboardView({ snapshot, upcomingEvents }: Readonly<{ snapshot: DashboardSnapshot; upcomingEvents: UpcomingEventsResult }>) {
  const sections = ORDER.flatMap(key => snapshot.sections.filter(result => keyOf(result) === key));
  const now = new Date(snapshot.capturedAt);
  return <div className="min-w-0">
    <header className="flex items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1><p className="mt-1 text-sm text-slate-600">Your next actions, with urgent work first.</p></div>
      <Link href="/tasks" className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-emerald-800 px-3 text-sm font-semibold text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2">Open tasks</Link>
    </header>
    <nav aria-label="Task summaries" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {sections.map(result => { const key = keyOf(result); return <a key={key} href={`#dashboard-${key}`} className={`flex min-h-20 flex-col justify-between rounded-lg border p-3 focus-visible:outline-2 focus-visible:outline-offset-2 ${key === "overdue" ? "border-rose-200 bg-rose-50 text-rose-950" : "border-slate-200 bg-white text-slate-900"}`}><span className="text-xs font-medium">{SECTION_COPY[key].title}</span><span className="mt-1 text-2xl font-semibold tabular-nums">{result.ok ? result.section.total : "Unavailable"}</span></a>; })}
    </nav>
    <p className="mt-2 text-xs text-slate-500">Groups overlap. All deadlines use Sydney time.</p>
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">{sections.map(result => <TaskSection key={keyOf(result)} result={result} now={now} />)}</div>
    <div className="mt-4"><UpcomingEventsPanel result={upcomingEvents} /></div>
  </div>;
}
