"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { EVENT_STATUSES, EVENT_TYPES, type EventDTO, type EventInput, type EventMutationResult, type EventStatus, type EventType } from "../core/contracts";
import { validateEventInput } from "../core/validation";
type Props = Readonly<{ createEventAction: (input: EventInput) => Promise<EventMutationResult>; initialRecord?: EventDTO; updateEventAction: (id: string, input: EventInput) => Promise<EventMutationResult> }>;
const fieldClass = "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200";
export function localDateTime(iso?: string) {
  if (!iso) return "";
  if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(iso)) return iso.slice(0, 16);
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit", month: "2-digit", timeZone: "Australia/Sydney", year: "numeric" }).formatToParts(new Date(iso)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export function EventEditor({ createEventAction, initialRecord, updateEventAction }: Props) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [message, setMessage] = useState(""); const last = useRef(""); const lock = useRef(false);
  const [values, setValues] = useState<EventInput>(initialRecord ? { description: initialRecord.description, eventType: initialRecord.eventType, location: initialRecord.location, name: initialRecord.name, requiresStudentId: initialRecord.requiresStudentId, startsAt: localDateTime(initialRecord.startsAt), status: initialRecord.status } : { description: "", eventType: "weekly_session", location: "", name: "", requiresStudentId: false, startsAt: "", status: "scheduled" });
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return; setMessage("");
    const checked = validateEventInput(values);
    if (!checked.ok) { setMessage(checked.errors.map((item) => item.message).join(" ")); return; }
    const fingerprint = JSON.stringify(checked.value);
    if (fingerprint === last.current) { setMessage("This exact event was already submitted."); return; }
    lock.current = true; setPending(true);
    try {
      const result = initialRecord ? await updateEventAction(initialRecord.id, checked.value) : await createEventAction(checked.value);
      if (!result.ok) { setMessage(result.code === "PERMISSION_DENIED" ? "You do not have permission to save events." : result.code === "VALIDATION" ? (result.errors ?? []).map((item) => item.message).join(" ") : "The event could not be saved. Try again."); return; }
      last.current = fingerprint; router.push(`/events/${result.record.id}?saved=1`); router.refresh();
    } catch { setMessage("The save could not be confirmed. Check the event list before retrying."); }
    finally { lock.current = false; setPending(false); }
  }
  return <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" noValidate onSubmit={submit}>
    {message ? <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="alert">{message}</p> : null}
    <label className="block text-sm font-semibold text-slate-800">Name<input className={fieldClass} disabled={pending} maxLength={200} onChange={(e) => set("name", e.target.value)} required value={values.name}/></label>
    <label className="block text-sm font-semibold text-slate-800">Description<textarea className={`${fieldClass} min-h-32`} disabled={pending} maxLength={10000} required onChange={(e) => set("description", e.target.value)} value={values.description}/></label>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-800">Type<select className={fieldClass} disabled={pending} onChange={(e) => set("eventType", e.target.value as EventType)} value={values.eventType}>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type === "weekly_session" ? "Weekly session" : "Tournament"}</option>)}</select></label><label className="text-sm font-semibold text-slate-800">Status<select className={fieldClass} disabled={pending} onChange={(e) => set("status", e.target.value as EventStatus)} value={values.status}>{EVENT_STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}</select></label></div>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-800">Date and time<input className={fieldClass} disabled={pending} onChange={(e) => set("startsAt", e.target.value)} required type="datetime-local" value={localDateTime(values.startsAt)}/></label><label className="text-sm font-semibold text-slate-800">Location<input className={fieldClass} disabled={pending} maxLength={300} onChange={(e) => set("location", e.target.value)} required value={values.location}/></label></div>
    <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800"><input checked={values.requiresStudentId} disabled={pending} onChange={(e) => set("requiresStudentId", e.target.checked)} type="checkbox"/>Require student ID for registration</label>
    <button className="min-h-11 rounded-xl bg-emerald-950 px-5 py-3 font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Saving…" : initialRecord ? "Save event" : "Create event"}</button>
  </form>;
}
