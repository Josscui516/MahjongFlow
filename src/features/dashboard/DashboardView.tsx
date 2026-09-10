import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { DueRiskReminder } from "@/features/tasks/reminders";
import Link from "next/link";

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

function TaskSection({ result, now }: Readonly<{ result: DashboardTaskSectionResult; now: Date }>) {
  const copy = SECTION_COPY[result.ok ? result.section.key : result.key];
  return (
    <section aria-labelledby={`dashboard-${result.ok ? result.section.key : result.key}`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950" id={`dashboard-${result.ok ? result.section.key : result.key}`}>{copy.title}</h2>
        {result.ok ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800" aria-label={`${result.section.total} tasks`}>{result.section.total}</span> : null}
      </div>
      {!result.ok ? (
        <p className={`mt-3 rounded-xl p-4 text-sm ${result.code === "UPSTREAM_NOT_CONNECTED" ? "bg-amber-50 text-amber-950" : "bg-rose-50 text-rose-900"}`} role={result.code === "UPSTREAM_NOT_CONNECTED" ? "status" : "alert"}>
          {result.code === "UPSTREAM_NOT_CONNECTED" ? "Task summaries are waiting for the shared task query provider." : result.code === "PERMISSION_DENIED" ? "You do not have permission to view this task summary." : "This task summary could not be loaded."}
        </p>
      ) : result.section.items.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">{copy.empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {result.section.items.map((task) => (
            <li className="rounded-xl bg-slate-50 p-4" key={task.id}>
              <Link className="font-semibold text-emerald-900 underline underline-offset-2" href={`/tasks/${encodeURIComponent(task.id)}`}>{task.title}</Link>
              <p className="mt-1 text-sm text-slate-600">Due {task.dueDate}</p>
              <DueRiskReminder risk={classifyTaskDueRisk({ ...task, now })} taskTitle={task.title} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardView({ snapshot, upcomingEvents }: Readonly<{
  snapshot: DashboardSnapshot;
  upcomingEvents: UpcomingEventsResult;
}>) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">Committee workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Review personal responsibility, team backlog, and due-date risk from one consistent snapshot.</p>
      </header>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {snapshot.sections.map((section) => <TaskSection key={section.ok ? section.section.key : section.key} result={section} now={new Date(snapshot.capturedAt)} />)}
      </div>
      <div className="mt-5"><UpcomingEventsPanel result={upcomingEvents} /></div>
    </main>
  );
}
