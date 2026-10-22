import Link from "next/link";
import type { ReactNode } from "react";
import { classifyTaskDueRisk } from "@/features/tasks/due-risk";
import { DueRiskReminder } from "@/features/tasks/reminders/DueRiskReminder";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import { TASK_STATUS_LABELS, taskDateLabel } from "@/features/tasks/presentation";
import { PreparationSubmitButton } from "./PreparationSubmitButton";
import { TaskChoicePicker } from "./TaskChoicePicker";
import type { EventPreparationResult } from "./contracts";

type LinkAction = (formData: FormData) => Promise<void>;
function TaskRows({ tasks, eventId, linkAction, now }: Readonly<{ tasks: readonly TaskRecordDTO[]; eventId: string; linkAction: LinkAction; now: Date }>) {
  return <ul className="divide-y divide-slate-200">{tasks.map(task => <li className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center" key={task.id}>
    <div className="min-w-0 flex-1"><h3 className="break-words font-semibold text-slate-950">{task.title}</h3><p className="mt-1 text-sm text-slate-600">{TASK_STATUS_LABELS[task.status]} · Due <time dateTime={task.dueDate}>{taskDateLabel(task.dueDate)}</time></p>{classifyTaskDueRisk({ ...task, now }).value === "overdue" ? <DueRiskReminder compact risk={{ ok: true, value: "overdue" }} taskTitle={task.title} dueDate={task.dueDate} now={now} /> : null}</div>
    <div className="flex shrink-0 flex-wrap items-center gap-2"><Link aria-label={`View task: ${task.title}`} className="inline-flex min-h-11 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/tasks/${task.id}`}>View task</Link><form action={linkAction}><input name="originEventId" type="hidden" value={eventId} /><input name="taskId" type="hidden" value={task.id} /><input name="eventId" type="hidden" value="" /><PreparationSubmitButton remove taskTitle={task.title} /></form></div>
  </li>)}</ul>;
}

export function PreparationPanel({ candidates, candidateControls, eventId, linkAction, result, now = new Date() }: Readonly<{ candidates: readonly TaskRecordDTO[]; candidateControls?: ReactNode; eventId: string; linkAction: LinkAction; result: EventPreparationResult; now?: Date }>) {
  if (!result.ok) {
    const message = result.code === "PERMISSION_DENIED" ? "You do not have permission to view preparation tasks." : result.code === "NOT_FOUND" ? "This event is unavailable." : "Preparation tasks could not be loaded.";
    return <section aria-label="Event preparation" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900" role="alert"><h2 className="font-semibold">Preparation unavailable</h2><p className="mt-1 text-sm">{message}</p></section>;
  }
  const { progress, tasks } = result.snapshot;
  const available = candidates.filter(candidate => candidate.eventId !== eventId);
  const unfinished = tasks.filter(task => task.status !== "completed").sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  const overdue = unfinished.filter(task => classifyTaskDueRisk({ ...task, now }).value === "overdue").length;
  const completed = tasks.filter(task => task.status === "completed");
  return <section aria-labelledby="preparation-heading" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="scroll-mt-4 text-xl font-semibold text-slate-950" id="preparation-heading">Preparation tasks</h2><div className="flex flex-wrap items-center gap-3">{overdue > 0 ? <span className="rounded-md bg-red-50 px-2 py-1 text-sm font-semibold text-red-900">{overdue} overdue {overdue === 1 ? "task" : "tasks"}</span> : null}{tasks.length > 0 ? <p className="text-sm font-medium text-slate-600" aria-label={`${progress.completed} of ${progress.total} tasks completed`}><strong className="font-semibold text-emerald-900">{progress.completed}/{progress.total}</strong> completed</p> : null}</div></div>
    {available.length > 0 ? <form action={linkAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><input name="originEventId" type="hidden" value={eventId} /><input name="eventId" type="hidden" value={eventId} /><TaskChoicePicker key={tasks.map(task => task.id).join(":")} choices={available.map(({ id, title, dueDate, status }) => ({ id, title, dueDate, status }))} /></form> : null}
    {candidateControls}
    {tasks.length === 0 ? <div className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-slate-900">No preparation tasks yet</p><p className="mt-1 text-sm text-slate-600">Link your first task to start tracking preparation.</p></div> : unfinished.length ? <div><TaskRows tasks={unfinished.slice(0, 5)} eventId={eventId} linkAction={linkAction} now={now} />{unfinished.length > 5 ? <details className="group border-t border-slate-200"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2"><span className="group-open:hidden">Show all {unfinished.length} tasks</span><span className="hidden group-open:inline">Show fewer tasks</span></summary><TaskRows tasks={unfinished.slice(5)} eventId={eventId} linkAction={linkAction} now={now} /></details> : null}</div> : <p className="text-sm font-medium text-emerald-900">All preparation tasks are completed.</p>}
    {completed.length ? <details className="border-y border-slate-200"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2">Completed tasks ({completed.length})</summary><TaskRows tasks={completed} eventId={eventId} linkAction={linkAction} now={now} /></details> : null}
    <p className="text-sm text-slate-600">Link an existing task to this event. Unlinking keeps the task itself.</p>
  </section>;
}
