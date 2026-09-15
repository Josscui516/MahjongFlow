"use client";
import { useRef, useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import {taskDetailHref} from "../list/return-context";
import {TASK_STATUS_LABELS as labels} from "../presentation";
import { useRouter } from "next/navigation";
import type { TaskInput, TaskMutationResult, TaskRecordDTO, TaskStatus } from "../core/contracts";
import { TASK_STATUSES } from "../core/contracts";
import { validateTaskInput } from "../core/validation";
import type { AssigneeOption } from "./server";


type TaskEditorProps = Readonly<{
  assignees: readonly AssigneeOption[];
  createTaskAction: (input: TaskInput) => Promise<TaskMutationResult>;
  initialRecord?: TaskRecordDTO;
  returnTo?: string;
  updateTaskAction: (taskId: string, input: TaskInput) => Promise<TaskMutationResult>;
}>;

export function TaskEditor({ assignees, createTaskAction, initialRecord, updateTaskAction, returnTo = "/tasks" }: TaskEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState<TaskInput>(initialRecord ?? { assigneeId: assignees[0]?.id ?? "", description: "", dueDate: "", status: "not_started", title: "" });
  const [message, setMessage] = useState(""); const [pending, setPending] = useState(false); const last = useRef("");
  const [errors,setErrors]=useState<Partial<Record<keyof TaskInput,string>>>({});
  const errorRef=useRef<HTMLParagraphElement>(null);
  useEffect(() => {if(message) errorRef.current?.focus();},[message]);
  const cancelHref=initialRecord ? taskDetailHref(initialRecord.id,returnTo) : returnTo;
  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (pending) return; setMessage(""); setErrors({});
    const form = new FormData(event.currentTarget);
    const input = {...values,title:String(form.get("title") ?? ""),description:String(form.get("description") ?? ""),assigneeId:String(form.get("assigneeId") ?? ""),dueDate:String(form.get("dueDate") ?? ""),status:String(form.get("status") ?? "") as TaskStatus};
    const checked = validateTaskInput(input); if (!checked.ok) { setErrors(Object.fromEntries(checked.errors.map(error => [error.field,error.message]))); setMessage(checked.errors.map((error) => error.message).join(" ")); return; }
    const fingerprint = JSON.stringify(checked.value); if (last.current === fingerprint) { setMessage("This exact task was already submitted."); return; }
    setPending(true);
    let result: TaskMutationResult;
    try {
      result = initialRecord ? await updateTaskAction(initialRecord.id, checked.value) : await createTaskAction(checked.value);
    } catch {
      setMessage("The task could not be saved. Try again.");
      return;
    } finally {
      setPending(false);
    }
    if (!result.ok) { if (result.code === "VALIDATION") setErrors(Object.fromEntries((result.errors ?? []).map(error => [error.field,error.message]))); setMessage(result.code === "PERMISSION_DENIED" ? "You do not have permission to save tasks." : result.code === "VALIDATION" ? (result.errors ?? []).map((error) => error.message).join(" ") : "The task could not be saved. Try again."); return; }
    last.current = fingerprint; router.push(`${taskDetailHref(result.record.id,returnTo)}&saved=1`); router.refresh();
  }
  return <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" noValidate onSubmit={submit}>
    <p className="text-sm text-slate-600">All fields are required. Dates use Sydney time.</p>
    {message ? <p ref={errorRef} tabIndex={-1} className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">{message}</p> : null}
    <div><label className="block text-sm font-semibold text-slate-800">Title<input id="task-title" name="title" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "error-title" : undefined} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" disabled={pending} maxLength={200} onChange={(e) => set("title", e.target.value)} required value={values.title}/></label>{errors.title ? <p id="error-title" className="text-sm text-rose-800">{errors.title}</p> : null}</div>
    <div><label className="block text-sm font-semibold text-slate-800">Description<textarea id="task-description" name="description" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "error-description" : undefined} className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" disabled={pending} maxLength={10000} onChange={(e) => set("description", e.target.value)} required value={values.description}/></label>{errors.description ? <p id="error-description" className="text-sm text-rose-800">{errors.description}</p> : null}</div>
    <div className="grid gap-5 sm:grid-cols-3">
      <div><label className="text-sm font-semibold text-slate-800">Assignee<select id="task-assigneeId" name="assigneeId" aria-invalid={Boolean(errors.assigneeId)} aria-describedby={errors.assigneeId ? "error-assigneeId" : undefined} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950" disabled={pending} onChange={(e) => set("assigneeId", e.target.value)} value={values.assigneeId}>{assignees.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>{errors.assigneeId ? <p id="error-assigneeId" className="text-sm text-rose-800">{errors.assigneeId}</p> : null}</div>
      <div><label className="text-sm font-semibold text-slate-800">Due date<input id="task-dueDate" name="dueDate" aria-invalid={Boolean(errors.dueDate)} aria-describedby={errors.dueDate ? "error-dueDate" : undefined} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950" disabled={pending} onChange={(e) => set("dueDate", e.target.value)} required type="date" value={values.dueDate}/></label>{errors.dueDate ? <p id="error-dueDate" className="text-sm text-rose-800">{errors.dueDate}</p> : null}</div>
      <div><label className="text-sm font-semibold text-slate-800">Status<select id="task-status" name="status" aria-invalid={Boolean(errors.status)} aria-describedby={errors.status ? "error-status" : undefined} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950" disabled={pending} onChange={(e) => set("status", e.target.value as TaskStatus)} value={values.status}>{TASK_STATUSES.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>{errors.status ? <p id="error-status" className="text-sm text-rose-800">{errors.status}</p> : null}</div>
    </div>
    <div className="flex flex-wrap items-center gap-3"><button className="min-h-11 rounded-xl bg-emerald-950 px-5 py-3 font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:opacity-50" disabled={pending} type="submit">{pending ? "Saving…" : initialRecord ? "Save task" : "Create task"}</button>{!pending ? <Link className="inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold text-slate-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href={cancelHref}>Cancel</Link> : null}</div>
  </form>;
}
