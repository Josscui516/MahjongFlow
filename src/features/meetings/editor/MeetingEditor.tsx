"use client";

import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import {
  MEETING_SUMMARY_MAX_LENGTH,
  MEETING_TITLE_MAX_LENGTH,
} from "@/features/meetings/schemas";

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
  formatSydneyDateTimeDisplay,
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

function CharacterCounter({ current, id, maximum }: Readonly<{
  current: number;
  id: string;
  maximum: number;
}>) {
  const nearingLimit = current >= maximum * 0.9;

  return (
    <p
      className={`mt-2 text-right text-xs tabular-nums ${nearingLimit ? "font-semibold text-amber-800" : "text-slate-500"}`}
      id={id}
    >
      {current.toLocaleString("en-AU")} / {maximum.toLocaleString("en-AU")} characters
    </p>
  );
}

function MeetingCreationProgress() {
  return (
    <nav aria-label="Meeting creation progress" className="mb-5">
      <ol className="grid grid-cols-[minmax(0,auto)_minmax(2rem,1fr)_minmax(0,auto)] items-center gap-3 text-sm">
        <li aria-current="step" className="flex min-w-0 items-center gap-2.5 font-semibold text-emerald-950">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-950 text-xs text-white">
            1
          </span>
          <span className="truncate">Meeting details</span>
          <span className="sr-only">, current step</span>
        </li>
        <li aria-hidden="true" className="h-px bg-slate-300" />
        <li className="flex min-w-0 items-center gap-2.5 text-slate-500">
          <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600">
            2
          </span>
          <span className="truncate">Add agenda</span>
        </li>
      </ol>
    </nav>
  );
}

type MeetingEditorCommonProps = Readonly<{
  agendaSlot?: ReactNode;
  attendeeOptions: readonly MeetingAttendeeOption[];
  onSaved?: (record: MeetingRecordDTO) => void;
  port: MeetingEditorPort;
}>;

type MeetingEditorProps = MeetingEditorCommonProps & Readonly<
  | { initialRecord?: never; justCreated?: never; mode: "create" }
  | { initialRecord: MeetingRecordDTO; justCreated?: boolean; mode: "update" }
>;

export function MeetingEditor({ agendaSlot, attendeeOptions, initialRecord, justCreated = false, mode, onSaved, port }: MeetingEditorProps) {
  const initialValues = useMemo(() => initialRecord ? valuesFromRecord(initialRecord) : EMPTY_VALUES, [initialRecord]);
  const [editing, setEditing] = useState(mode === "create");
  const [errors, setErrors] = useState<readonly MeetingEditorError[]>([]);
  const [pending, setPending] = useState(false);
  const [record, setRecord] = useState<MeetingRecordDTO | undefined>(initialRecord);
  const [status, setStatus] = useState<MeetingEditorStatus>("idle");
  const [values, setValues] = useState<MeetingEditorValues>(initialValues);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const lastSubmission = useRef<string | null>(null);
  const selectedAttendees = useMemo(() => new Set(values.attendeeIds), [values.attendeeIds]);
  const attendeeError = fieldError(errors, "attendeeIds");
  const attendeeDescribedBy = attendeeError
    ? "meeting-attendeeIds-description meeting-attendeeIds-error"
    : "meeting-attendeeIds-description";
  const hasAttendeeOptions = attendeeOptions.length > 0;

  useEffect(() => {
    if (status === "validation") errorSummaryRef.current?.querySelector<HTMLElement>("[tabindex='-1']")?.focus();
  }, [status]);

  function setValue<Key extends keyof MeetingEditorValues>(key: Key, value: MeetingEditorValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => current.filter((error) => error.field !== key));
    if (status === "validation") setStatus("idle");
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
    setRecord(result.record);
    setErrors([]);
    setValues(valuesFromRecord(result.record));
    setStatus("success");
    setEditing(false);
    setPending(false);
    onSaved?.(result.record);
  }

  if (!editing && initialRecord) {
    const participantCount = values.attendeeIds.length;
    const participantLabel = `${participantCount} ${participantCount === 1 ? "participant" : "participants"}`;
    const selectedParticipantNames = attendeeOptions
      .filter((option) => selectedAttendees.has(option.id))
      .map((option) => option.label);
    const visibleParticipantNames = selectedParticipantNames.slice(0, 3);
    const remainingParticipantCount = selectedParticipantNames.length - visibleParticipantNames.length;

    return (
      <div className="max-w-4xl space-y-5">
          {justCreated ? <MeetingStatePanel description="The meeting record is ready. Add discussion points and key decisions next." state="success" title="Meeting created" /> : null}
          {status === "success" ? <MeetingStatePanel description="Your meeting changes are saved." state="success" title="Meeting saved" /> : null}
          <section aria-labelledby="recorded-meeting-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-slate-950" id="recorded-meeting-heading">{values.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{formatSydneyDateTimeDisplay(record?.startsAt ?? initialRecord.startsAt)} · {participantLabel}</p>
              </div>
              <button className="min-h-11 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" onClick={() => setEditing(true)} type="button">Edit meeting</button>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold text-slate-900">Participants</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {visibleParticipantNames.map((name) => <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700" key={name}>{name}</span>)}
                {remainingParticipantCount > 0 ? <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">+{remainingParticipantCount} more</span> : null}
                {visibleParticipantNames.length === 0 ? <span className="text-sm text-slate-600">{participantLabel}</span> : null}
              </div>
              <h3 className="mt-5 text-sm font-semibold text-slate-900">Summary</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{values.summary}</p>
            </div>
          </section>
          {agendaSlot}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {mode === "create" ? <MeetingCreationProgress /> : null}
      <form className="space-y-5" noValidate onSubmit={submitMeeting}>
        <div ref={errorSummaryRef}><ErrorSummary errors={errors} /></div>
        {status === "duplicate" ? <MeetingStatePanel description="This exact meeting submission was already accepted. Review the current values before trying again." state="duplicate" title="Already submitted" /> : null}
        {status === "permission" ? <MeetingStatePanel description="You do not have permission to save this meeting." state="permission" title="Access required" /> : null}
        {status === "system-error" ? <MeetingStatePanel description="The meeting could not be saved. Try again." state="system" title="Something went wrong" /> : null}
        <section aria-labelledby="meeting-details-heading" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950" id="meeting-details-heading">
              Meeting details
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Add the information committee members need to recognise this meeting.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <div>
              <FormField
                control={
                  <input
                    aria-describedby="meeting-title-counter"
                    autoComplete="off"
                    disabled={pending}
                    maxLength={MEETING_TITLE_MAX_LENGTH}
                    name="title"
                    onChange={(event) => setValue("title", event.target.value)}
                    value={values.title}
                  />
                }
                description="Use a concise committee-facing title."
                error={fieldError(errors, "title")}
                id="meeting-title"
                label="Meeting title"
                required
              />
              <CharacterCounter current={values.title.length} id="meeting-title-counter" maximum={MEETING_TITLE_MAX_LENGTH} />
            </div>
            <FormField
              control={
                <input
                  disabled={pending}
                  name="startsAt"
                  onChange={(event) => setValue("startsAt", event.target.value)}
                  type="datetime-local"
                  value={values.startsAt}
                />
              }
              description="Australia/Sydney local time; AEST or AEDT is applied automatically."
              error={fieldError(errors, "startsAt")}
              id="meeting-startsAt"
              label="Meeting date and time"
              required
            />
          </div>

          <fieldset
            aria-describedby={attendeeDescribedBy}
            aria-invalid={attendeeError ? true : undefined}
            className="mt-7 border-t border-slate-200 pt-6"
            disabled={pending}
          >
            <legend className="text-sm font-semibold text-slate-900">Participants <span className="text-rose-700">*</span></legend>
            <p className="mt-1 text-sm text-slate-600">Select current committee members.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {attendeeOptions.map((option, index) => <label className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-emerald-950 transition hover:border-slate-400 has-[:checked]:border-emerald-700 has-[:checked]:bg-emerald-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-emerald-700" key={option.id}><input aria-describedby={attendeeDescribedBy} aria-invalid={attendeeError ? true : undefined} checked={selectedAttendees.has(option.id)} className="size-4 accent-emerald-800" id={index === 0 ? "meeting-attendeeIds" : undefined} name="attendeeIds" onChange={(event) => { const next = new Set(values.attendeeIds); if (event.target.checked) next.add(option.id); else next.delete(option.id); setValue("attendeeIds", [...next]); }} type="checkbox" value={option.id} />{option.label}</label>)}
            </div>
            {!hasAttendeeOptions ? <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900" role="status">No committee profiles are available. Ask an administrator to add a profile before creating this meeting.</p> : null}
            <p className="sr-only" id="meeting-attendeeIds-description">Select at least one committee participant.</p>
            {attendeeError ? <p className="mt-2 text-sm text-rose-800" id="meeting-attendeeIds-error"><span className="font-semibold">Error:</span> {attendeeError}</p> : null}
          </fieldset>

          <div aria-labelledby="meeting-summary-heading" className="mt-7 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-bold tracking-tight text-slate-950" id="meeting-summary-heading">
              Meeting summary
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">
              Capture a committee-safe overview. Ordered agenda items are added after creation.
            </p>
            <div className="mt-5">
              <FormField
                control={
                  <textarea
                    aria-describedby="meeting-summary-counter"
                    className="min-h-36 resize-y"
                    disabled={pending}
                    maxLength={MEETING_SUMMARY_MAX_LENGTH}
                    name="summary"
                    onChange={(event) => setValue("summary", event.target.value)}
                    value={values.summary}
                  />
                }
                description="This summary is shown on the meeting detail page."
                error={fieldError(errors, "summary")}
                id="meeting-summary"
                label="Summary"
                required
              />
              <CharacterCounter current={values.summary.length} id="meeting-summary-counter" maximum={MEETING_SUMMARY_MAX_LENGTH} />
            </div>
          </div>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
          {mode === "update" ? <button className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" onClick={() => { setValues(initialValues); setErrors([]); setStatus("idle"); setEditing(false); }} type="button">Cancel</button> : <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href="/meetings">Cancel</Link>}
          <SubmitButton disabled={!hasAttendeeOptions} pending={pending} pendingLabel="Saving meeting…">{mode === "create" ? "Create and add agenda" : "Save changes"}</SubmitButton>
        </div>
      </form>
      {mode === "update" ? agendaSlot : null}
    </div>
  );
}
