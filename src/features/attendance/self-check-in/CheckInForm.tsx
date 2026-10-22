"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { SelfCheckInOutcome } from "./contracts";
import { checkInFormErrors, type CheckInFormField } from "./form-validation";

const MESSAGES: Record<SelfCheckInOutcome, string> = {
  already_processed: "Your registration is already recorded. No need to submit again.",
  rate_limited: "Too many attempts. Please wait a minute before trying again.",
  success: "You're registered. Enjoy the event!",
  system_error: "Registration could not be completed. Your details are still here. Please try again.",
  unable_to_process: "We could not confirm registration with these details. Check your name and email, or contact event staff.",
  unavailable: "This registration link is no longer available. Scan the current event QR code or contact event staff.",
};

export function CheckInConfirmation({ outcome }: Readonly<{ outcome: "success" | "already_processed" }>) {
  return <div className="mt-6 space-y-3">
    <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5" aria-labelledby="check-in-result-heading" role="status">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200">
          <svg className="size-5" fill="none" viewBox="0 0 24 24"><path d="m7 12 3 3 7-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id="check-in-result-heading" className="text-xl font-bold text-emerald-950">{outcome === "success" ? "Registration confirmed" : "Already registered"}</h2>
          <p className="text-sm leading-6 text-emerald-950">{MESSAGES[outcome]}</p>
        </div>
      </div>
      <p className="text-sm leading-6 text-emerald-950">Please ask event staff to confirm your attendance.</p>
      <p className="text-sm font-medium text-emerald-950">You can close this page.</p>
    </section>
    {outcome === "already_processed" ? <p className="text-sm leading-6 text-slate-600">Need to correct your details? Contact event staff.</p> : null}
  </div>;
}

export function CheckInForm({ studentIdRequired, token }: Readonly<{ studentIdRequired: boolean; token: string }>) {
  const [outcome, setOutcome] = useState<SelfCheckInOutcome | null>(null);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<CheckInFormField, string>>>({});
  const lock = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (outcome === "success" || outcome === "already_processed") resultRef.current?.focus();
  }, [outcome]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || outcome === "success" || outcome === "already_processed") return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const values = { fullName: String(form.get("fullName") ?? ""), email: String(form.get("email") ?? ""), studentId: String(form.get("studentId") ?? ""), privacyAccepted: form.get("privacyAccepted") === "on" };
    const nextErrors = checkInFormErrors(values, studentIdRequired);
    setErrors(nextErrors);
    setOutcome(null);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) { element.querySelector<HTMLInputElement>(`[name="${firstError}"]`)?.focus(); return; }
    lock.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/register/${encodeURIComponent(token)}`, {
        body: JSON.stringify({ ...values, studentId: studentIdRequired ? values.studentId : null }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { outcome?: SelfCheckInOutcome };
      setOutcome(payload.outcome && Object.hasOwn(MESSAGES, payload.outcome) ? payload.outcome : "system_error");
    } catch { setOutcome("system_error"); }
    finally { lock.current = false; setPending(false); }
  }

  function clearError(field: CheckInFormField) {
    if (errors[field]) setErrors(current => ({ ...current, [field]: undefined }));
  }
  const inputClass = "mt-1 block min-h-12 w-full rounded-xl border border-slate-300 px-3 py-3 text-base text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 aria-invalid:border-rose-500";
  function fieldError(field: CheckInFormField) { return errors[field] ? <p id={`${field}-error`} className="mt-1 text-sm text-rose-800">{errors[field]}</p> : null; }
  if (outcome === "success" || outcome === "already_processed") return <div ref={resultRef} tabIndex={-1} className="focus:outline-none"><CheckInConfirmation outcome={outcome} /></div>;
  return <form className="mt-5 space-y-4" noValidate onSubmit={submit} aria-busy={pending}>
    <div className="space-y-1"><p className="text-sm leading-6 text-slate-700">Enter your name and email to register. Event staff will confirm your attendance.</p><p className="text-sm text-slate-600">No account needed. All fields are required.</p></div>
    <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
      <div><label className="block text-sm font-semibold text-slate-800" htmlFor="fullName">Full name</label><input autoComplete="name" autoCapitalize="words" className={inputClass} id="fullName" maxLength={120} name="fullName" required aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? "fullName-error" : undefined} onInput={() => clearError("fullName")} />{fieldError("fullName")}</div>
      <div><label className="block text-sm font-semibold text-slate-800" htmlFor="email">Email</label><input autoComplete="email" autoCapitalize="none" spellCheck={false} inputMode="email" className={inputClass} id="email" maxLength={254} name="email" required type="email" aria-invalid={Boolean(errors.email)} aria-describedby={`email-hint${errors.email ? " email-error" : ""}`} onInput={() => clearError("email")} /><p className="mt-1 text-sm text-slate-600" id="email-hint">If you registered before, use the same email.</p>{fieldError("email")}</div>
      {studentIdRequired ? <div><label className="block text-sm font-semibold text-slate-800" htmlFor="studentId">Student ID</label><input autoComplete="off" className={inputClass} id="studentId" maxLength={32} name="studentId" required aria-invalid={Boolean(errors.studentId)} aria-describedby={errors.studentId ? "studentId-error" : undefined} onInput={() => clearError("studentId")} />{fieldError("studentId")}</div> : null}
      <div><label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg py-2 text-sm leading-6 text-slate-700"><input className="mt-1 size-5 shrink-0 accent-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" name="privacyAccepted" required type="checkbox" aria-invalid={Boolean(errors.privacyAccepted)} aria-describedby={errors.privacyAccepted ? "privacyAccepted-error" : undefined} onChange={() => clearError("privacyAccepted")} /><span>I agree that {studentIdRequired ? "my name, email and student ID" : "my name and email"} will be used by authorised event staff to manage registration and attendance.</span></label>{fieldError("privacyAccepted")}</div>
      <button className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={pending || outcome === "unavailable"} type="submit">{pending ? "Registering…" : outcome === "system_error" ? "Try registration again" : "Confirm registration"}</button>
    </fieldset>
    {outcome ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm leading-6 text-rose-900" role="alert">{MESSAGES[outcome]}</p> : null}
  </form>;
}

export { MESSAGES as checkInMessages };
