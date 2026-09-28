"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { FormField } from "@/components/forms/FormField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import type { AttendanceAuditEvent, AttendanceAuditRecord } from "@/features/attendance/records";
import type { ManualAttendanceAction, ManualAttendanceField, ManualAttendanceState } from "./contracts";

type Props = Readonly<{
  event: AttendanceAuditEvent;
  records: readonly AttendanceAuditRecord[];
  action: ManualAttendanceAction;
  onUpdated?: (result: Extract<ManualAttendanceState, { status: "success" }>) => void;
  onRefresh?: () => void;
}>;

type Submission = Readonly<{
  result: ManualAttendanceState;
  attempt: number;
  intent: string;
}>;

const messages = {
  duplicate: "Attendance already exists. Refresh the records and use a correction instead of adding another record.",
  conflict: "This record has changed. Refresh the records, review the current status, and confirm again.",
  "permission-denied": "You do not have permission to change attendance records.",
  unauthenticated: "Sign in again before changing attendance records.",
  unavailable: "The selected event or participant is unavailable. Check the details before trying again.",
  "system-error": "Attendance could not be saved. Your fields are preserved; check the current records before retrying.",
  success: "Attendance saved. The attendance and dinner views can now read the updated record.",
} as const;

const dateFormatter = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short",
});

function formIntent(data: FormData): string {
  return data.get("operation") === "create"
    ? JSON.stringify(["create", String(data.get("email") ?? "").trim().toLowerCase()])
    : JSON.stringify(["correct", data.get("recordId"), data.get("expectedUpdatedAt"), data.get("targetStatus")]);
}

/** Client state only; authorisation, trusted audit values and atomic writes stay in the action. */
export function ManualAttendanceForm({ event, records, action, onUpdated, onRefresh }: Props) {
  const prefix = useId();
  const [operation, setOperation] = useState<"create" | "correct">("create");
  const [email, setEmail] = useState("");
  const [recordId, setRecordId] = useState("");
  const [confirmedIntent, setConfirmedIntent] = useState<string | null>(null);
  const submissionLock = useRef(false);
  const summaryRef = useRef<HTMLElement>(null);
  const notifiedAttempt = useRef(0);
  const selected = records.find((record) => record.id === recordId);
  const targetStatus = selected?.status === "confirmed" ? "voided" : "confirmed";
  const intent = operation === "create"
    ? JSON.stringify(["create", email.trim().toLowerCase()])
    : JSON.stringify(["correct", recordId, selected?.updatedAt ?? "", targetStatus]);

  const [submission, formAction, pending] = useActionState<Submission, FormData>(
    async (previous, data) => {
      let result: ManualAttendanceState;
      try {
        result = await action(previous.result, data);
      } catch {
        result = { status: "system-error" };
      } finally {
        submissionLock.current = false;
      }
      // A new envelope also refocuses an identical second validation response.
      return { result, attempt: previous.attempt + 1, intent: formIntent(data) };
    },
    { result: { status: "idle" }, attempt: 0, intent: "" },
  );
  const state = submission.result;
  const errors = state.status === "validation" ? state.errors : [];
  const accessLost = state.status === "permission-denied" || state.status === "unauthenticated";
  const awaitingNewIntent = ["success", "conflict", "duplicate"].includes(state.status)
    && submission.intent === intent;
  const confirmationKey = `${intent}:${submission.attempt}`;
  const ids: Record<ManualAttendanceField, string> = {
    email: `${prefix}-email`, recordId: `${prefix}-record`,
    targetStatus: `${prefix}-record`, expectedUpdatedAt: `${prefix}-record`,
    eventId: `${prefix}-operation`, operation: `${prefix}-operation`,
    confirmation: `${prefix}-confirmation`,
  };

  useEffect(() => {
    if (submission.attempt === 0) return;
    summaryRef.current?.focus();
    if (notifiedAttempt.current === submission.attempt) return;
    notifiedAttempt.current = submission.attempt;
    if (submission.result.status === "success") onUpdated?.(submission.result);
    if (submission.result.status === "conflict" || submission.result.status === "duplicate") onRefresh?.();
  }, [submission, onUpdated, onRefresh]);

  return (
    <form
      action={formAction}
      aria-label="Manual attendance"
      className="space-y-5"
      noValidate
      onSubmit={(event) => {
        if (submissionLock.current || pending || awaitingNewIntent || accessLost) {
          event.preventDefault();
          return;
        }
        submissionLock.current = true;
      }}
    >
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-950">Manual attendance</h2>
        {!accessLost && <p className="text-sm text-slate-600">{event.name}</p>}
      </header>

      {state.status !== "idle" && (
        <section
          className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-950 outline-offset-4"
          ref={summaryRef}
          role={state.status === "success" ? "status" : "alert"}
          tabIndex={-1}
        >
          {state.status === "validation" ? <>
            <h3 className="font-semibold">Check the attendance details</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {state.errors.map((error, index) => <li key={`${error.field}-${index}`}>
                <a className="underline underline-offset-4" href={`#${ids[error.field]}`} onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(ids[error.field])?.focus();
                }}>{error.message}</a>
              </li>)}
            </ul>
          </> : <p>{messages[state.status]}</p>}
          {state.status === "success" && state.refreshRequired && (
            <p className="mt-2">The write succeeded, but the page cache could not refresh. Refresh the records before making another correction.</p>
          )}
          {!accessLost && ["success", "conflict", "duplicate"].includes(state.status) && onRefresh && (
            <button type="button" className="mt-2 min-h-11 font-semibold underline" onClick={onRefresh}>Refresh records</button>
          )}
        </section>
      )}

      {!accessLost && <fieldset className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5" disabled={pending}>
        <legend className="px-1 font-semibold">Authorised staff action</legend>
        <FormField id={ids.operation} label="Operation" error={errors.find((error) => error.field === "operation" || error.field === "eventId")?.message} control={
          <select name="operation" value={operation} onChange={(event) => setOperation(event.target.value as "create" | "correct")}>
            <option value="create">Add manual attendance</option>
            <option value="correct" disabled={records.length === 0}>Correct an existing record</option>
          </select>
        } />
        {records.length === 0 && <p role="status" className="text-sm text-slate-600">No attendance records yet. You can add manual attendance for an existing participant.</p>}
        {operation === "create" ? <>
          <FormField id={ids.email} label="Participant email" required description="Enter the exact email of an existing participant after confirming their identity. This does not create a participant or registration." error={errors.find((error) => error.field === "email")?.message} control={
            <input name="email" type="email" autoComplete="off" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
          } />
          <p className="text-sm text-slate-600">The new attendance will be Confirmed and Manual. Your signed-in identity and the current time are recorded automatically.</p>
        </> : <>
          <FormField id={ids.recordId} label="Attendance record" required error={errors.find((error) => ["recordId", "expectedUpdatedAt", "targetStatus"].includes(error.field))?.message} control={
            <select name="recordId" value={recordId} onChange={(event) => setRecordId(event.target.value)}>
              <option value="">Choose a record</option>
              {records.map((record) => <option key={record.id} value={record.id}>{record.participantName} — {record.participantEmail} — {record.status === "confirmed" ? "Confirmed" : "Voided"}</option>)}
            </select>
          } />
          <input type="hidden" name="expectedUpdatedAt" value={selected?.updatedAt ?? ""} />
          <input type="hidden" name="targetStatus" value={targetStatus} />
          {selected && <div className="space-y-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
            <p><strong>{selected.status === "confirmed" ? "Void attendance" : "Restore attendance"}</strong> for {selected.participantName} in {event.name}.</p>
            <p className="[overflow-wrap:anywhere]">{selected.participantEmail}</p>
            <p>Original method: {selected.method === "qr" ? "QR" : "Manual"}. Checked in: <time dateTime={selected.checkedInAt}>{dateFormatter.format(new Date(selected.checkedInAt))}</time> (Australia/Sydney). These original details will not change.</p>
            <p>Only the status, current authorised operator, and update time change. Dinner eligibility is derived from the updated attendance.</p>
          </div>}
        </>}
        <div className="space-y-2">
          <label className="flex min-h-11 items-start gap-3 text-sm text-slate-900" htmlFor={ids.confirmation}>
            <input
              className="mt-1 size-4 shrink-0"
              id={ids.confirmation}
              name="confirmation"
              type="checkbox"
              value="confirmed"
              checked={confirmedIntent === confirmationKey}
              onChange={(event) => setConfirmedIntent(event.target.checked ? confirmationKey : null)}
              aria-invalid={errors.some((error) => error.field === "confirmation") || undefined}
              aria-describedby={errors.some((error) => error.field === "confirmation") ? `${ids.confirmation}-error` : undefined}
            />
            <span>I have verified the participant and confirm this attendance change for {event.name}.</span>
          </label>
          {errors.filter((error) => error.field === "confirmation").map((error) => <p id={`${ids.confirmation}-error`} key={error.field} className="text-sm text-rose-800">{error.message}</p>)}
        </div>
        {awaitingNewIntent && <p className="text-sm text-slate-600">Review refreshed records or choose a different participant before submitting again.</p>}
        <SubmitButton pending={pending} pendingLabel="Saving attendance…" disabled={awaitingNewIntent || (operation === "correct" && !selected)}>
          {operation === "create" ? "Add attendance" : selected?.status === "confirmed" ? "Void attendance" : "Restore attendance"}
        </SubmitButton>
      </fieldset>}
    </form>
  );
}

/** Route integration leaf: refreshes its server-owned inputs without importing consumers. */
export function ConnectedManualAttendanceForm(props: Omit<Props, "onUpdated" | "onRefresh">) {
  const router = useRouter();
  return <ManualAttendanceForm {...props} onUpdated={() => router.refresh()} onRefresh={() => router.refresh()} />;
}
