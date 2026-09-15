import {taskDateLabel} from "@/features/tasks/presentation";
import Link from "next/link";
import { taskDetailHref } from "./return-context";
import { TaskFilters } from "./TaskFilters";
import { classifyTaskDueRisk } from "../due-risk";
import { DueRiskReminder } from "../reminders";
import { EmptyFeedback } from "@/components/feedback";
import { TaskDeleteButton } from "../TaskDeleteButton";
import type { TaskRecordDTO, TaskStatus } from "../core/contracts";
import { buildTaskListHref, hasTaskListFilters, type TaskListCriteria } from "./search-params";


const STATUS: Readonly<Record<TaskStatus, { className: string; label: string }>> = {
  completed: { className: "bg-emerald-50 text-emerald-800 ring-emerald-200", label: "Completed" },
  in_progress: { className: "bg-amber-50 text-amber-800 ring-amber-200", label: "In progress" },
  not_started: { className: "bg-slate-100 text-slate-700 ring-slate-200", label: "Not started" },
};

export function TaskList({ assigneeLabels, criteria, items, total, now = new Date() }: Readonly<{ assigneeLabels: ReadonlyMap<string, string>; criteria: TaskListCriteria; items: readonly TaskRecordDTO[]; total: number; now?: Date }>) {
  const hasFilters = hasTaskListFilters(criteria);
  const currentHref = buildTaskListHref(criteria);
  const successHref = `${currentHref}${currentHref.includes("?") ? "&" : "?"}deleted=1`;

  return <div className="space-y-5">
    <TaskFilters key={currentHref} assigneeLabels={assigneeLabels} criteria={criteria} />

    {items.length === 0 ? <EmptyFeedback action={hasFilters ? <Link className="font-semibold underline underline-offset-4" href="/tasks">Clear search and filters</Link> : <Link className="font-semibold underline underline-offset-4" href="/tasks/new">Create the first task</Link>} description={hasFilters ? "Try different assignee, status, date, or event filters." : "Create an action item directly, or convert a decision from a meeting."} title={hasFilters ? "No matching tasks" : "No tasks yet"} /> : <>
      <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3"><p className="text-sm font-semibold text-slate-800" role="status">Showing {items.length} of {total} matching {total === 1 ? "task" : "tasks"}</p><p className="text-sm text-slate-500">{criteria.sort === "due_soonest" ? "Due soonest first" : criteria.sort === "due_latest" ? "Due latest first" : "Recently updated first"}</p></div>
      <ol className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {items.map((task) => { const status = STATUS[task.status]; const headingId = `task-list-item-${task.id}`; return <li key={task.id}><article aria-labelledby={headingId} className="grid gap-3 p-4 transition-colors hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_10rem_auto] sm:items-center sm:px-6">
          <Link className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700" href={taskDetailHref(task.id, currentHref)}><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-slate-950" id={headingId}>{task.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${status.className}`}>{status.label}</span></div><p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">{task.description}</p><p className="mt-2 text-xs font-medium text-slate-500">Assigned to {assigneeLabels.get(task.assigneeId) ?? "Unavailable member"}{task.sourceMeetingId ? " · From meeting" : " · Direct task"}</p></Link>
          <div className="min-w-0 text-sm"><span className="block text-xs font-bold uppercase tracking-wide text-slate-500">Due</span><time className="mt-1 block font-semibold text-emerald-800" dateTime={task.dueDate}>{taskDateLabel(task.dueDate)}</time><DueRiskReminder compact dueDate={task.dueDate} now={now} risk={classifyTaskDueRisk({ ...task, now })} taskTitle={task.title} /></div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end"><Link className="inline-flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={taskDetailHref(task.id, currentHref)}>Open task</Link><TaskDeleteButton hasSource={Boolean(task.sourceMeetingId)} successHref={successHref} taskId={task.id} taskTitle={task.title} /></div>
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
