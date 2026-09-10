import Link from "next/link";
import { EmptyFeedback } from "@/components/feedback";
import { TaskDeleteButton } from "../TaskDeleteButton";
import type { TaskRecordDTO, TaskStatus } from "../core/contracts";
import { buildTaskListHref, hasTaskListFilters, type TaskListCriteria } from "./search-params";

const CONTROL_CLASS = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200";
const STATUS: Readonly<Record<TaskStatus, { className: string; label: string }>> = {
  completed: { className: "bg-emerald-50 text-emerald-800 ring-emerald-200", label: "Completed" },
  in_progress: { className: "bg-amber-50 text-amber-800 ring-amber-200", label: "In progress" },
  not_started: { className: "bg-slate-100 text-slate-700 ring-slate-200", label: "Not started" },
};
const DATE_FORMATTER = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeZone: "UTC" });

export function TaskList({ assigneeLabels, criteria, items, total }: Readonly<{ assigneeLabels: ReadonlyMap<string, string>; criteria: TaskListCriteria; items: readonly TaskRecordDTO[]; total: number }>) {
  const hasFilters = hasTaskListFilters(criteria);
  const currentHref = buildTaskListHref(criteria);
  const successHref = `${currentHref}${currentHref.includes("?") ? "&" : "?"}deleted=1`;

  return <div className="space-y-5">
    <form action="/tasks" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" method="get">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Search tasks<input className={CONTROL_CLASS} defaultValue={criteria.search} maxLength={100} name="q" placeholder="Title or description" type="search" /></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Assignee<select className={CONTROL_CLASS} defaultValue={criteria.assigneeId ?? ""} name="assigneeId"><option value="">All assignees</option>{[...assigneeLabels].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Status<select className={CONTROL_CLASS} defaultValue={criteria.status} name="status"><option value="all">All statuses</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Event ID<input className={CONTROL_CLASS} defaultValue={criteria.eventId ?? ""} name="eventId" placeholder="Event UUID" /></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Due from<input className={CONTROL_CLASS} defaultValue={criteria.dueFrom ?? ""} name="dueFrom" type="date" /></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Due to<input className={CONTROL_CLASS} defaultValue={criteria.dueTo ?? ""} name="dueTo" type="date" /></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Sort<select className={CONTROL_CLASS} defaultValue={criteria.sort} name="sort"><option value="due_soonest">Due soonest</option><option value="due_latest">Due latest</option><option value="updated_recent">Recently updated</option></select></label>
        <div className="flex min-h-11 items-center gap-2"><button className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 lg:flex-none" type="submit">Apply</button>{hasFilters ? <Link className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/tasks">Clear</Link> : null}</div>
      </div>
    </form>

    {items.length === 0 ? <EmptyFeedback action={hasFilters ? <Link className="font-semibold underline underline-offset-4" href="/tasks">Clear search and filters</Link> : <Link className="font-semibold underline underline-offset-4" href="/tasks/new">Create the first task</Link>} description={hasFilters ? "Try different assignee, status, date, or event filters." : "Create an action item directly, or convert a decision from a meeting."} title={hasFilters ? "No matching tasks" : "No tasks yet"} /> : <>
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><p className="text-sm font-semibold text-slate-800" role="status">Showing {items.length} of {total} matching {total === 1 ? "task" : "tasks"}</p><p className="text-sm text-slate-500">{criteria.sort === "due_soonest" ? "Due soonest first" : criteria.sort === "due_latest" ? "Due latest first" : "Recently updated first"}</p></div>
      <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {items.map((task) => { const status = STATUS[task.status]; const headingId = `task-list-item-${task.id}`; return <li key={task.id}><article aria-labelledby={headingId} className="grid min-h-32 gap-4 p-5 transition-colors hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-center sm:px-6">
          <Link className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700" href={`/tasks/${encodeURIComponent(task.id)}`}><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-slate-950" id={headingId}>{task.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>{status.label}</span></div><p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">{task.description}</p><p className="mt-2 text-xs font-medium text-slate-500">Assigned to {assigneeLabels.get(task.assigneeId) ?? "Unavailable member"}{task.sourceMeetingId ? " · From meeting" : " · Direct task"}</p></Link>
          <p className="text-sm"><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Due</span><time className="mt-1 block font-semibold text-emerald-800" dateTime={task.dueDate}>{DATE_FORMATTER.format(new Date(`${task.dueDate}T00:00:00Z`))}</time></p>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end"><Link className="inline-flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/tasks/${encodeURIComponent(task.id)}`}>Open task</Link><TaskDeleteButton hasSource={Boolean(task.sourceMeetingId)} successHref={successHref} taskId={task.id} taskTitle={task.title} /></div>
        </article></li>; })}
      </ol>
      <nav aria-label="Task list pages" className="flex items-center justify-between gap-3">
        {criteria.page > 1 ? <Link className="font-semibold text-emerald-900 underline underline-offset-4" href={buildTaskListHref(criteria, criteria.page - 1)}>Previous page</Link> : <span />}
        <span className="text-sm text-slate-600">Page {criteria.page}</span>
        {criteria.page * criteria.pageSize < total ? <Link className="font-semibold text-emerald-900 underline underline-offset-4" href={buildTaskListHref(criteria, criteria.page + 1)}>Next page</Link> : <span />}
      </nav>
    </>}
  </div>;
}
