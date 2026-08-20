"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";

import type {
  MeetingAttendeeOption,
  MeetingEditorError,
  MeetingEditorPort,
  MeetingEditorStatus,
  MeetingEditorValues,
  MeetingRecordDTO,
} from "./contracts";
import { MeetingStatePanel } from "./MeetingStatePanel";
import {
  createSubmissionFingerprint,
  formatSydneyDateTimeInput,
  mapMeetingValidationErrors,
  validateMeetingEditor,
} from "./validation";
import { submitMeetingSafely } from "./submission";

const EMPTY_VALUES: MeetingEditorValues = { attendeeIds: [], startsAt: "", summary: "", title: "" };

function valuesFromRecord(record: MeetingRecordDTO): MeetingEditorValues {
  return {
    attendeeIds: record.attendeeIds,
    startsAt: formatSydneyDateTimeInput(record.startsAt),
    summary: record.summary,
    title: record.title,
  };
}

function ErrorSummary({ errors }: Readonly<{ errors: readonly MeetingEditorError[] }>) {
  if (errors.length === 0) return null;
  return (
    <section aria-labelledby="meeting-error-title" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950" role="alert" tabIndex={-1}>
      <h2 className="font-semibold" id="meeting-error-title">Fix the following before saving</h2>
      <p className="mt-1 text-sm">The meeting could not be saved.</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {errors.map((error) => <li key={error.field}><a className="font-medium underline underline-offset-2" href={`#meeting-${error.field}`}>{error.label}: {error.message}</a></li>)}
      </ul>
    </section>
  );
}

function fieldError(errors: readonly MeetingEditorError[], field: MeetingEditorError["field"]) {
  return errors.find((error) => error.field === field)?.message;
}

type MeetingEditorCommonProps = Readonly<{
  agendaSlot?: ReactNode;
  attendeeOptions: readonly MeetingAttendeeOption[];
  onSaved?: (record: MeetingRecordDTO) => void;
  port: MeetingEditorPort;
}>;

type MeetingEditorProps = MeetingEditorCommonProps & Readonly<
  | { initialRecord?: never; mode: "create" }
  | { initialRecord: MeetingRecordDTO; mode: "update" }
>;

export function MeetingEditor({ agendaSlot, attendeeOptions, initialRecord, mode, onSaved, port }: MeetingEditorProps) {
  const initialValues = useMemo(() => initialRecord ? valuesFromRecord(initialRecord) : EMPTY_VALUES, [initialRecord]);
  const [editing, setEditing] = useState(mode === "create");
  const [errors, setErrors] = useState<readonly MeetingEditorError[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<MeetingEditorStatus>("idle");
  const [values, setValues] = useState<MeetingEditorValues>(initialValues);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const lastSubmission = useRef<string | null>(null);
  const selectedAttendees = useMemo(() => new Set(values.attendeeIds), [values.attendeeIds]);

  useEffect(() => {
    if (status === "validation") errorSummaryRef.current?.querySelector<HTMLElement>("[tabindex='-1']")?.focus();
  }, [status]);

  function setValue<Key extends keyof MeetingEditorValues>(key: Key, value: MeetingEditorValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const nextErrors = validateMeetingEditor(values);
    if (nextErrors.length > 0) {
      setErrors(nextErrors); setStatus("validation"); setPending(false); return;
    }
    const fingerprint = createSubmissionFingerprint(values);
    if (fingerprint === lastSubmission.current) {
      setStatus("duplicate"); setPending(false); return;
    }
    const result = await submitMeetingSafely(
      port,
      mode === "create"
        ? { mode }
        : { initialRecord, mode },
      values,
    );
    if (!result.ok) {
      if (result.code === "VALIDATION") {
        setErrors(mapMeetingValidationErrors(result.errors ?? []));
        setStatus("validation");
      } else if (result.code === "PERMISSION_DENIED") {
        setStatus("permission");
      } else {
        setStatus("system-error");
      }
      setPending(false); return;
    }
    lastSubmission.current = fingerprint;
    setErrors([]);
    setValues(valuesFromRecord(result.record));
    setStatus("success");
    setEditing(false);
    setPending(false);
    onSaved?.(result.record);
  }

  if (!editing && initialRecord) {
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
        <div className="space-y-5">
          {status === "success" ? <MeetingStatePanel description="Your meeting changes are saved." state="success" title="Meeting saved" /> : null}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Meeting</p>
            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-xl font-bold text-slate-950">{values.title}</h2><p className="mt-2 text-sm text-slate-600">{values.startsAt.replace("T", " at ")} · {values.attendeeIds.length} participants</p></div>
              <button className="rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" onClick={() => setEditing(true)} type="button">Edit meeting</button>
            </div>
            <p className="mt-5 border-t border-slate-200 pt-5 text-sm leading-6 text-slate-700">{values.summary}</p>
          </section>
          {agendaSlot}
        </div>
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">Future extension</p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">Linked work</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Reserved for task traceability. This area is intentionally non-interactive in Issue #56.</p>
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">Linked tasks will appear here in a future work package.</div>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form className="space-y-5" noValidate onSubmit={submitMeeting}>
        <div ref={errorSummaryRef}><ErrorSummary errors={errors} /></div>
        {status === "duplicate" ? <MeetingStatePanel description="This exact meeting submission was already accepted. Review the current values before trying again." state="duplicate" title="Already submitted" /> : null}
        {status === "permission" ? <MeetingStatePanel description="You do not have permission to save this meeting." state="permission" title="Access required" /> : null}
        {status === "system-error" ? <MeetingStatePanel description="The meeting could not be saved. Try again." state="system" title="Something went wrong" /> : null}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-2">
            <FormField control={<input autoComplete="off" name="title" onChange={(event) => setValue("title", event.target.value)} value={values.title} />} description="Use a concise committee-facing title." error={fieldError(errors, "title")} id="meeting-title" label="Meeting title" required />
            <FormField control={<input name="startsAt" onChange={(event) => setValue("startsAt", event.target.value)} type="datetime-local" value={values.startsAt} />} description="Enter local time using Australia/Sydney semantics." error={fieldError(errors, "startsAt")} id="meeting-startsAt" label="Meeting date and time" required />
          </div>
          <fieldset className="mt-6">
            <legend className="text-sm font-semibold text-slate-900">Participants <span className="text-rose-700">*</span></legend>
            <p className="mt-1 text-sm text-slate-600">Select current committee members.</p>
            <div aria-describedby="meeting-attendeeIds-description meeting-attendeeIds-error" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" id="meeting-attendeeIds">
              {attendeeOptions.map((option) => <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-50" key={option.id}><input checked={selectedAttendees.has(option.id)} className="size-4 accent-emerald-800" name="attendeeIds" onChange={(event) => { const next = new Set(values.attendeeIds); if (event.target.checked) next.add(option.id); else next.delete(option.id); setValue("attendeeIds", [...next]); }} type="checkbox" value={option.id} />{option.label}</label>)}
            </div>
            {attendeeOptions.length === 0 ? <p className="mt-3 text-sm text-amber-800">No committee profiles are available. Ask an administrator to add a profile before saving.</p> : null}
            <p className="sr-only" id="meeting-attendeeIds-description">Select at least one committee participant.</p>
            {fieldError(errors, "attendeeIds") ? <p className="mt-2 text-sm text-rose-800" id="meeting-attendeeIds-error"><span className="font-semibold">Error:</span> {fieldError(errors, "attendeeIds")}</p> : null}
          </fieldset>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <FormField control={<textarea className="min-h-36 resize-y" name="summary" onChange={(event) => setValue("summary", event.target.value)} value={values.summary} />} description="This committee-safe summary is shown on the detail page." error={fieldError(errors, "summary")} id="meeting-summary" label="Summary" required />
        </section>
        <div className="flex flex-wrap justify-end gap-3">
          {mode === "update" ? <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50" onClick={() => { setValues(initialValues); setErrors([]); setStatus("idle"); setEditing(false); }} type="button">Cancel</button> : <Link className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50" href="/meetings">Cancel</Link>}
          <SubmitButton pending={pending} pendingLabel="Saving meeting…">{mode === "create" ? "Create meeting" : "Save changes"}</SubmitButton>
        </div>
      </form>
      {mode === "update" ? agendaSlot : null}
    </div>
  );
}
