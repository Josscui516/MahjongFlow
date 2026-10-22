import Link from "next/link";
import { DashboardTaskRows, MoreDashboardTasks } from "./DashboardTaskRows";

import type {
  DashboardSnapshot,
  DashboardTaskSectionKey,
  DashboardTaskSectionResult,
} from "./contracts";
import { UpcomingEventsPanel, type UpcomingEventsResult } from "./upcoming-events";
import { DashboardWorkspace } from "./DashboardWorkspace";

const SECTION_COPY: Record<DashboardTaskSectionKey, Readonly<{ empty: string; title: string }>> = {
  mine: { empty: "You have no unfinished tasks.", title: "My unfinished tasks" },
  unfinished: { empty: "There are no unfinished committee tasks.", title: "All unfinished tasks" },
  dueSoon: { empty: "No tasks are due in the next seven days.", title: "Due soon" },
  overdue: { empty: "No tasks are overdue.", title: "Overdue" },
};

const ORDER: DashboardTaskSectionKey[] = ["mine", "overdue", "dueSoon", "unfinished"];
const keyOf = (result: DashboardTaskSectionResult) => result.ok ? result.section.key : result.key;

function TaskSection({ result, now }: Readonly<{ result: DashboardTaskSectionResult; now: Date }>) {
  const key = keyOf(result);
  const copy = SECTION_COPY[key];
  return <>
    {!result.ok ? <p className="mt-3 text-sm text-rose-900" role="alert">{result.code === "UPSTREAM_NOT_CONNECTED" ? "Task summaries are waiting for the shared task query provider." : result.code === "PERMISSION_DENIED" ? "You do not have permission to view this task summary." : "This task summary could not be loaded."}</p>
    : result.section.items.length === 0 ? <p className="mt-3 text-sm text-slate-600">{copy.empty}</p>
    : <>
      <DashboardTaskRows items={result.section.items.slice(0, 3).map(({ id, title, dueDate, status }) => ({ id, title, dueDate, status }))} capturedAt={now.toISOString()} />
      {result.section.items.length > 3 ? <MoreDashboardTasks items={result.section.items.slice(3).map(({ id, title, dueDate, status }) => ({ id, title, dueDate, status }))} capturedAt={now.toISOString()} /> : null}
    </>}
  </>;
}

export function DashboardView({ snapshot, upcomingEvents }: Readonly<{ snapshot: DashboardSnapshot; upcomingEvents: UpcomingEventsResult }>) {
  const sections = ORDER.flatMap(key => snapshot.sections.filter(result => keyOf(result) === key));
  const now = new Date(snapshot.capturedAt);

  return <div className="min-w-0">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard</h1><p className="mt-1 text-sm text-slate-600">Upcoming events and work that needs your attention.</p></div>
    </header>
    <nav aria-label="Quick actions" className="mt-5 flex flex-wrap gap-2">
      <Link href="/meetings/new" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2">New meeting</Link>
      <Link href="/tasks/new" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2">New task</Link>
      <Link href="/events/new" className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2">New event</Link>
    </nav>
    <DashboardWorkspace tabs={sections.map(result => {
      const key = keyOf(result);
      const labels = { mine: "Mine", overdue: "Overdue", dueSoon: "Due soon", unfinished: "All tasks" };
      const scopes = { mine: "Your unfinished tasks, earliest deadline first.", overdue: "All committee tasks past their deadline.", dueSoon: "All committee tasks due today or within 7 days.", unfinished: "All unfinished committee tasks, earliest deadline first." };
      return {key, title: SECTION_COPY[key].title, label: labels[key], scope: scopes[key], total: result.ok ? result.section.total : null, content: <TaskSection result={result} now={now} />};
    })} events={<UpcomingEventsPanel result={upcomingEvents} />} />
  </div>;
}
