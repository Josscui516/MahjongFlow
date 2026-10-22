"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormErrorSummary, FormField } from "@/components/forms";
import { EVENT_STATUSES, EVENT_TYPES, type EventDTO, type EventInput, type EventMutationResult, type EventStatus, type EventType, type EventValidationError } from "../core/contracts";
import { EVENT_STATUS_LABELS } from "../presentation";
import { eventCreateDefaults, localDateTime } from "./create-defaults";
import { readEventForm } from "./form-input";
import { validateEventInput } from "../core/validation";

type Props = Readonly<{ createEventAction: (input: EventInput) => Promise<EventMutationResult>; initialRecord?: EventDTO; createInstant?: string; updateEventAction: (id: string, input: EventInput) => Promise<EventMutationResult> }>;
const labels: Record<keyof EventInput, string> = { name: "Name", description: "Description", location: "Location", startsAt: "Date and time (Sydney time)", eventType: "Type", status: "Status", requiresStudentId: "Student ID requirement" };
const fieldOrder: readonly (keyof EventInput)[] = ["name", "startsAt", "location", "eventType", "status", "description", "requiresStudentId"];

export function EventEditor({ createEventAction, initialRecord, createInstant, updateEventAction }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<readonly EventValidationError[]>([]);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const last = useRef("");
  const lock = useRef(false);
  const [values, setValues] = useState<EventInput>(initialRecord ? { description: initialRecord.description, eventType: initialRecord.eventType, location: initialRecord.location, name: initialRecord.name, requiresStudentId: false, startsAt: localDateTime(initialRecord.startsAt), status: initialRecord.status } : createInstant ? eventCreateDefaults(new Date(createInstant)) : { description: "", eventType: "weekly_session", location: "", name: "", requiresStudentId: false, startsAt: "", status: "scheduled" });
  const set = <K extends keyof EventInput>(key: K, value: EventInput[K]) => setValues(current => ({ ...current, [key]: value }));
  const errorFor = (field: keyof EventInput) => errors.find(error => error.field === field)?.message;
  useEffect(() => {
    if (errors.length || message) feedbackRef.current?.querySelector<HTMLElement>('[role="alert"]')?.focus();
  }, [errors, message]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setMessage(""); setErrors([]);
    const checked = validateEventInput(readEventForm(new FormData(event.currentTarget)));
    if (!checked.ok) { setErrors(checked.errors); return; }
    const fingerprint = JSON.stringify(checked.value);
    if (fingerprint === last.current) { setMessage("This exact event was already submitted."); return; }
    lock.current = true; setPending(true);
    try {
      const result = initialRecord ? await updateEventAction(initialRecord.id, checked.value) : await createEventAction(checked.value);
      if (!result.ok) {
        if (result.code === "VALIDATION" && result.errors?.length) setErrors(result.errors);
        else setMessage(result.code === "PERMISSION_DENIED" ? "You do not have permission to save events." : "The event could not be saved. Try again.");
        return;
      }
      last.current = fingerprint; router.push(`/events/${result.record.id}?saved=1`); router.refresh();
    } catch { setMessage("The save could not be confirmed. Check the event list before retrying."); }
    finally { lock.current = false; setPending(false); }
  }

  return <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6" noValidate onSubmit={submit}>
    <p className="text-sm text-slate-600">Fields marked * are required. Dates use Sydney time.</p>
    <div ref={feedbackRef}>
      <FormErrorSummary title="Check the event details" errors={[...errors].sort((a, b) => fieldOrder.indexOf(a.field) - fieldOrder.indexOf(b.field)).map(error => ({ fieldId: `event-${error.field}`, label: labels[error.field], message: error.message }))} />
      {message ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950" role="alert" tabIndex={-1}>{message}</p> : null}
    </div>
    <FormField id="event-name" label="Name" required error={errorFor("name")} control={<input disabled={pending} maxLength={200} name="name" onChange={e => set("name", e.target.value)} value={values.name} />} />
    <div className="grid gap-5 sm:grid-cols-2">
      <FormField id="event-startsAt" label={labels.startsAt} required error={errorFor("startsAt")} control={<input disabled={pending} name="startsAt" type="datetime-local" defaultValue={values.startsAt} />} />
      <FormField id="event-location" label="Location" required error={errorFor("location")} control={<input disabled={pending} maxLength={300} name="location" onChange={e => set("location", e.target.value)} value={values.location} />} />
      <FormField id="event-eventType" label="Type" required error={errorFor("eventType")} control={<select disabled={pending} name="eventType" onChange={e => set("eventType", e.target.value as EventType)} value={values.eventType}>{EVENT_TYPES.map(type => <option key={type} value={type}>{type === "weekly_session" ? "Weekly session" : "Tournament"}</option>)}</select>} />
      <FormField id="event-status" label="Status" required error={errorFor("status")} control={<select disabled={pending} name="status" onChange={e => set("status", e.target.value as EventStatus)} value={values.status}>{EVENT_STATUSES.map(status => <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>)}</select>} />
    </div>
    <FormField id="event-description" label="Description" description="Outline the activities, who the event is for, and what to bring." required error={errorFor("description")} control={<textarea className="min-h-24" disabled={pending} maxLength={10000} name="description" onChange={e => set("description", e.target.value)} value={values.description} />} />
    <div className="flex flex-wrap items-center gap-3">
      <button className="min-h-11 rounded-lg bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50" disabled={pending} type="submit">{pending ? "Saving…" : initialRecord ? "Save event" : "Create event"}</button>
      {!pending ? <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 underline focus-visible:outline-2 focus-visible:outline-offset-2" href={initialRecord ? `/events/${initialRecord.id}` : "/events"}>Cancel</Link> : null}
    </div>
  </form>;
}
