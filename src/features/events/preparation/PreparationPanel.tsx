import type { TaskRecordDTO } from "@/features/tasks/core/contracts";
import type { EventPreparationResult } from "./contracts";

type LinkAction = (formData: FormData) => Promise<void>;

export function PreparationPanel({ candidates, eventId, linkAction, result }: Readonly<{ candidates: readonly TaskRecordDTO[]; eventId: string; linkAction: LinkAction; result: EventPreparationResult }>) {
  if (!result.ok) {
    const message = result.code === "PERMISSION_DENIED" ? "You do not have permission to view preparation tasks." : result.code === "NOT_FOUND" ? "This event is unavailable." : "Preparation tasks could not be loaded.";
    return <section aria-label="Event preparation" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900" role="alert"><h2 className="font-semibold">Preparation unavailable</h2><p className="mt-1 text-sm">{message}</p></section>;
  }

  const { progress, tasks } = result.snapshot;
  const available = candidates.filter((candidate) => candidate.eventId !== eventId);
  return <section aria-labelledby="preparation-heading" className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold text-slate-950" id="preparation-heading">Preparation tasks</h2><p className="mt-1 text-sm text-slate-600">Completed {progress.completed} of {progress.total}</p></div><strong className="text-2xl text-emerald-900" aria-label={`${progress.completed} of ${progress.total} tasks completed`}>{progress.completed}/{progress.total}</strong></div>
    {tasks.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">No preparation tasks are linked to this event.</p> : <ul className="divide-y divide-slate-200">{tasks.map((task) => <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={task.id}><div><p className="font-semibold text-slate-900">{task.title}</p><p className="text-sm text-slate-600">{task.status.replaceAll("_", " ")} · due {task.dueDate}</p></div><form action={linkAction}><input name="originEventId" type="hidden" value={eventId}/><input name="taskId" type="hidden" value={task.id}/><input name="eventId" type="hidden" value=""/><button className="min-h-11 rounded-lg px-3 font-semibold text-rose-800 hover:bg-rose-50" type="submit">Unlink</button></form></li>)}</ul>}
    {available.length > 0 ? <form action={linkAction} className="grid gap-3 sm:grid-cols-[1fr_auto]"><input name="originEventId" type="hidden" value={eventId}/><input name="eventId" type="hidden" value={eventId}/><label className="grid gap-1 text-sm font-semibold text-slate-800">Link a task<select className="min-h-11 rounded-lg border border-slate-300 px-3" name="taskId" required>{available.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label><button className="min-h-11 self-end rounded-lg bg-emerald-950 px-4 font-semibold text-white" type="submit">Link task</button></form> : null}
  </section>;
}
