"use client";

import { useState, type FormEvent } from "react";
import type { SelfCheckInOutcome } from "./contracts";

const MESSAGES: Record<SelfCheckInOutcome, string> = {
  already_processed: "Already registered. Contact staff if a correction is needed.",
  rate_limited: "Too many attempts. Please wait and try again.",
  success: "Registration successful. This does not confirm attendance or dinner eligibility.",
  system_error: "Registration could not be completed. Please try again.",
  unable_to_process: "Unable to process registration. Check your name, email, required student ID and privacy consent, or contact event staff.",
  unavailable: "Registration unavailable.",
};

export function CheckInForm({ studentIdRequired, token }: Readonly<{ studentIdRequired: boolean; token: string }>) {
  const [outcome, setOutcome] = useState<SelfCheckInOutcome | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setOutcome(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/register/${encodeURIComponent(token)}`, {
        body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), studentId: form.get("studentId"), privacyAccepted: form.get("privacyAccepted") === "on" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as { outcome?: SelfCheckInOutcome };
      setOutcome(payload.outcome ?? "system_error");
    } catch {
      setOutcome("system_error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <p className="text-sm text-slate-700">Register for this event using your details. You do not need a previous registration or a committee account. Dinner is managed using a separate administrator-preloaded roster.</p>
      <div><label className="block text-sm font-semibold text-slate-800" htmlFor="fullName">Full name</label><input autoComplete="name" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" id="fullName" maxLength={120} name="fullName" required /></div>
      <div><label className="block text-sm font-semibold text-slate-800" htmlFor="email">Email</label><input autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" id="email" maxLength={254} name="email" required type="email" /></div>
      {studentIdRequired ? <div><label className="block text-sm font-semibold text-slate-800" htmlFor="studentId">Student ID</label><input autoComplete="off" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" id="studentId" maxLength={32} name="studentId" required /></div> : null}
      <label className="flex gap-3 text-sm text-slate-700"><input className="mt-1" name="privacyAccepted" required type="checkbox" />I agree that my name, email and required student ID will be used by authorised event staff to manage this registration.</label>
      <button className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">{pending ? "Registering…" : "Register for event"}</button>
      <p aria-live="polite" className={outcome === "success" ? "text-emerald-800" : "text-slate-700"} role={outcome && outcome !== "success" ? "alert" : "status"}>{outcome ? MESSAGES[outcome] : ""}</p>
    </form>
  );
}

export { MESSAGES as checkInMessages };
