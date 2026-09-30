"use client";

import { useState, type FormEvent } from "react";
import type { SelfCheckInOutcome } from "./contracts";

const MESSAGES: Record<SelfCheckInOutcome, string> = {
  already_processed: "Already processed. Contact staff if a correction is needed.",
  rate_limited: "Too many attempts. Please wait and try again.",
  success: "Check-in successful.",
  system_error: "Check-in could not be completed. Please try again.",
  unable_to_process: "Unable to process check-in. Please check your details or contact staff.",
  unavailable: "Check-in unavailable.",
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
      const response = await fetch(`/api/check-in/${encodeURIComponent(token)}`, {
        body: JSON.stringify({ email: form.get("email"), studentId: form.get("studentId") }),
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
      <div><label className="block text-sm font-semibold text-slate-800" htmlFor="email">Email</label><input autoComplete="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" id="email" maxLength={254} name="email" required type="email" /></div>
      {studentIdRequired ? <div><label className="block text-sm font-semibold text-slate-800" htmlFor="studentId">Student ID</label><input autoComplete="off" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" id="studentId" maxLength={32} name="studentId" required /></div> : null}
      <button className="rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={pending} type="submit">{pending ? "Checking in…" : "Check in"}</button>
      <p aria-live="polite" className={outcome === "success" ? "text-emerald-800" : "text-slate-700"} role={outcome && outcome !== "success" ? "alert" : "status"}>{outcome ? MESSAGES[outcome] : ""}</p>
    </form>
  );
}

export { MESSAGES as checkInMessages };
