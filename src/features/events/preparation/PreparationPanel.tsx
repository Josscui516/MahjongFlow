import Link from "next/link";
import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import { TASK_STATUS_LABELS, taskDateLabel } from "@/features/tasks/presentation";
import { PreparationSubmitButton } from "./PreparationSubmitButton";
import type { EventPreparationResult } from "./contracts";

type LinkAction = (formData: FormData) => Promise<void>;
function TaskRows({ tasks, eventId, linkAction }: Readonly<{ tasks: readonly TaskRecordDTO[]; eventId: string; linkAction: LinkAction }>) {
  return <ul className="divide-y divide-slate-200">{tasks.map(task => <li className="flex flex-col items-start justify-between gap-3 py-3 sm:flex-row sm:items-center" key={task.id}>
    <div className="min-w-0 flex-1"><Link className="inline-flex min-h-11 items-center break-words rounded-sm font-semibold text-emerald-950 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/tasks/${task.id}`}>{task.title}</Link><p className="text-sm text-slate-600">{TASK_STATUS_LABELS[task.status]} · Due <time dateTime={task.dueDate}>{taskDateLabel(task.dueDate)}</time></p></div>
    <form action={linkAction}><input name="originEventId" type="hidden" value={eventId} /><input name="taskId" type="hidden" value={task.id} /><input name="eventId" type="hidden" value="" /><PreparationSubmitButton remove taskTitle={task.title} /></form>
  </li>)}</ul>;
}

export function PreparationPanel({ candidates, eventId, linkAction, result }: Readonly<{ candidates: readonly TaskRecordDTO[]; eventId: string; linkAction: LinkAction; result: EventPreparationResult }>) {
  if (!result.ok) {
    const message = result.code === "PERMISSION_DENIED" ? "You do not have permission to view preparation tasks." : result.code === "NOT_FOUND" ? "This event is unavailable." : "Preparation tasks could not be loaded.";
    return <section aria-label="Event preparation" className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-900" role="alert"><h2 className="font-semibold">Preparation unavailable</h2><p className="mt-1 text-sm">{message}</p></section>;
  }
  const { progress, tasks } = result.snapshot;
  const available = candidates.filter(candidate => candidate.eventId !== eventId);
  const unfinished = tasks.filter(task => task.status !== "completed");
  const completed = tasks.filter(task => task.status === "completed");
  return <section aria-labelledby="preparation-heading" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex items-end justify-between gap-4"><div><h2 className="scroll-mt-4 text-xl font-semibold text-slate-950" id="preparation-heading">Preparation tasks</h2><p className="mt-1 text-sm text-slate-600">Completed {progress.completed} of {progress.total}</p></div><strong className="text-2xl text-emerald-900" aria-label={`${progress.completed} of ${progress.total} tasks completed`}>{progress.completed}/{progress.total}</strong></div>
    {tasks.length === 0 ? <p className="text-sm text-slate-600">No preparation tasks have been added to this event.</p> : unfinished.length ? <TaskRows tasks={unfinished} eventId={eventId} linkAction={linkAction} /> : <p className="text-sm font-medium text-emerald-900">All preparation tasks are completed.</p>}
    {completed.length ? <details className="border-y border-slate-200"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2">Completed tasks ({completed.length})</summary><TaskRows tasks={completed} eventId={eventId} linkAction={linkAction} /></details> : null}
    {available.length > 0 ? <form action={linkAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><input name="originEventId" type="hidden" value={eventId} /><input name="eventId" type="hidden" value={eventId} /><label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-800">Add existing task<select className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2" name="taskId" defaultValue="" required><option value="" disabled>Choose a task</option>{available.map(task => <option key={task.id} value={task.id}>{task.title} · {taskDateLabel(task.dueDate)}</option>)}</select></label><PreparationSubmitButton /></form> : null}
    <p className="text-sm text-slate-600">Add existing tasks to track preparation progress. Removing a task from this event keeps the task itself.</p>
  </section>;
}
