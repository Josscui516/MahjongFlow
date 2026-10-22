"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {TASK_STATUS_LABELS, taskDateLabel} from "../presentation";
import Link from "next/link";
import { buildTaskListHref, parseTaskFilterCriteria, hasTaskListFilters, type TaskListCriteria } from "./search-params";
const CONTROL_CLASS = "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200";
export function TaskFilters({criteria, assigneeLabels, eventOptions = []}: Readonly<{eventOptions?: readonly { id: string; label: string }[]; criteria: TaskListCriteria; assigneeLabels: ReadonlyMap<string,string>}>) {
 const router = useRouter();
 const formRef = useRef<HTMLFormElement>(null);
 const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const composing = useRef(false);
 const requested = useRef(buildTaskListHref(criteria));
 const [errors, setErrors] = useState<readonly string[]>([]);
 const [pending, startTransition] = useTransition();
 const appliedHref = buildTaskListHref(criteria);
 useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
 useEffect(() => {
   if (!pending && !timer.current && appliedHref !== requested.current) {
     const form = formRef.current;
     const values = { q: criteria.search, status: criteria.status, assigneeId: criteria.assigneeId ?? "", dueFrom: criteria.dueFrom ?? "", dueTo: criteria.dueTo ?? "", eventId: criteria.eventId ?? "", sort: criteria.sort };
     for (const [name, value] of Object.entries(values)) {
       const control = form?.elements.namedItem(name);
       if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.value = value;
     }
     setErrors([]);
     requested.current = appliedHref;
   }
 }, [appliedHref, criteria, pending]);
 function update(form: HTMLFormElement, delay = 0) {
   if (timer.current) clearTimeout(timer.current);
   timer.current = null;
   const navigate = () => {
     timer.current = null;
     const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
     const parsed = parseTaskFilterCriteria(data);
     if (!parsed.ok) { setErrors(parsed.errors); return; }
     setErrors([]);
     const href = buildTaskListHref(parsed.criteria, 1);
     requested.current = href;
     startTransition(() => router.replace(href, { scroll: false }));
   };
   if (delay) timer.current = setTimeout(navigate, delay);
   else navigate();
 }
 function changed(event: FormEvent<HTMLFormElement>) {
   if (composing.current) return;
   const input = event.target as HTMLInputElement;
   update(event.currentTarget, input.name === "q" ? 300 : 0);
 }
 const hasFilters = hasTaskListFilters(criteria);
 const advanced = [criteria.eventId,criteria.dueFrom,criteria.dueTo].filter(Boolean).length;
 const active = [criteria.search ? `Search: ${criteria.search}` : null, criteria.status !== "all" ? `Status: ${TASK_STATUS_LABELS[criteria.status]}` : null, criteria.assigneeId ? `Assignee: ${assigneeLabels.get(criteria.assigneeId) ?? "Unavailable member"}` : null, criteria.eventId ? `Event: ${eventOptions.find(event => event.id === criteria.eventId)?.label ?? "Unavailable event"}` : null, criteria.dueFrom ? `From: ${taskDateLabel(criteria.dueFrom)}` : null, criteria.dueTo ? `To: ${taskDateLabel(criteria.dueTo)}` : null].filter(Boolean);
 return <form ref={formRef} onChange={changed} onCompositionStart={() => { composing.current = true; if (timer.current) clearTimeout(timer.current); timer.current = null; }} onCompositionEnd={(event) => { composing.current = false; update(event.currentTarget, 300); }} onSubmit={(event) => { event.preventDefault(); update(event.currentTarget); }} aria-busy={pending} id="task-filters" action="/tasks" method="get" className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 flow-root">
 <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="sm:col-span-2 lg:col-span-1 grid gap-1.5 text-sm font-semibold text-slate-800">Search tasks<input className={CONTROL_CLASS} defaultValue={criteria.search} maxLength={100} name="q" placeholder="Title or description" type="search" /></label>        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Status<select className={CONTROL_CLASS} defaultValue={criteria.status} name="status"><option value="all">All statuses</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Assignee<select className={CONTROL_CLASS} defaultValue={criteria.assigneeId ?? ""} name="assigneeId"><option value="">All assignees</option>{[...assigneeLabels].map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
 </div>

 <details className="mt-2" open={advanced > 0}>
 <summary className="w-fit cursor-pointer min-h-11 rounded-lg py-3 text-sm font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2">More filters{advanced ? ` (${advanced} active)` : ""}</summary>
 <div className="clear-both mt-2 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Due date from<input className={CONTROL_CLASS} defaultValue={criteria.dueFrom ?? ""} name="dueFrom" type="date" /></label>        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Due date to<input className={CONTROL_CLASS} defaultValue={criteria.dueTo ?? ""} name="dueTo" type="date" /></label>        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Event<select className={CONTROL_CLASS} defaultValue={criteria.eventId ?? ""} name="eventId"><option value="">All events</option>{criteria.eventId && !eventOptions.some(event => event.id === criteria.eventId) ? <option value={criteria.eventId}>Unavailable event</option> : null}{eventOptions.map(event => <option key={event.id} value={event.id}>{event.label}</option>)}</select></label>
 </div></details>


 {hasFilters ? <div className="clear-both mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3" aria-label="Active task filters">{active.map(filter => <span key={filter} className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{filter}</span>)}<Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4" href="/tasks">Clear all</Link></div> : null}
 {errors.length ? <p className="mt-3 text-sm text-rose-800" role="alert">{errors.join(" ")}</p> : null}
 <p className="sr-only" role="status">{pending ? "Updating tasks" : ""}</p>
 </form>;
}
