"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { TaskEditorPort, TaskInput, TaskRecordDTO, TaskStatus } from "../core/contracts";
import { TASK_STATUSES } from "../core/contracts";
import { validateTaskInput } from "../core/validation";
import type { AssigneeOption } from "./server";

const labels: Record<TaskStatus, string> = { completed: "Completed", in_progress: "In Progress", not_started: "Not Started" };
export function TaskEditor({ assignees, initialRecord, port }: Readonly<{ assignees: readonly AssigneeOption[]; initialRecord?: TaskRecordDTO; port: TaskEditorPort }>) {
  const router = useRouter();
  const [values, setValues] = useState<TaskInput>(initialRecord ?? { assigneeId: assignees[0]?.id ?? "", description: "", dueDate: "", status: "not_started", title: "" });
  const [message, setMessage] = useState(""); const [pending, setPending] = useState(false); const last = useRef("");
  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("");
    const checked = validateTaskInput(values); if (!checked.ok) { setMessage(checked.errors.map((error) => error.message).join(" ")); return; }
    const fingerprint = JSON.stringify(checked.value); if (last.current === fingerprint) { setMessage("This exact task was already submitted."); return; }
    setPending(true);
    const result = initialRecord ? await port.updateTask(initialRecord.id, checked.value) : await port.createTask(checked.value);
    setPending(false);
    if (!result.ok) { setMessage(result.code === "PERMISSION_DENIED" ? "You do not have permission to save tasks." : result.code === "VALIDATION" ? (result.errors ?? []).map((error) => error.message).join(" ") : "The task could not be saved. Try again."); return; }
    last.current = fingerprint; router.push(`/tasks/${result.record.id}?saved=1`); router.refresh();
  }
  return <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6" noValidate onSubmit={submit}>
    {message ? <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">{message}</p> : null}
    <label className="block text-sm font-semibold">Title<input className="mt-2 w-full rounded-xl border border-slate-300 p-3" disabled={pending} maxLength={200} onChange={(e) => set("title", e.target.value)} required value={values.title}/></label>
    <label className="block text-sm font-semibold">Description<textarea className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 p-3" disabled={pending} maxLength={10000} onChange={(e) => set("description", e.target.value)} required value={values.description}/></label>
    <div className="grid gap-5 sm:grid-cols-3">
      <label className="text-sm font-semibold">Assignee<select className="mt-2 w-full rounded-xl border border-slate-300 p-3" disabled={pending} onChange={(e) => set("assigneeId", e.target.value)} value={values.assigneeId}>{assignees.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
      <label className="text-sm font-semibold">Due date<input className="mt-2 w-full rounded-xl border border-slate-300 p-3" disabled={pending} onChange={(e) => set("dueDate", e.target.value)} required type="date" value={values.dueDate}/></label>
      <label className="text-sm font-semibold">Status<select className="mt-2 w-full rounded-xl border border-slate-300 p-3" disabled={pending} onChange={(e) => set("status", e.target.value as TaskStatus)} value={values.status}>{TASK_STATUSES.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
    </div>
    <button className="rounded-xl bg-emerald-950 px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Saving…" : initialRecord ? "Save task" : "Create task"}</button>
  </form>;
}
