"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useTransition } from "react";
import type { DinnerVerificationResult } from "./contracts";
import { DinnerFeedback } from "./DinnerFeedback";
import { initialVerificationState, verificationReducer } from "./refresh-state";

type Props = Readonly<{
  eventId: string;
  initialResult: DinnerVerificationResult;
  refreshAction: (eventId: string) => Promise<DinnerVerificationResult>;
  issueAction?: (eventId: string, participantId: string, issued: boolean, expectedIssued: boolean) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; code: string }>>;
}>;

export function DinnerVerification({ eventId, initialResult, refreshAction, issueAction }: Props) {
  const [state, dispatch] = useReducer(verificationReducer, initialResult, initialVerificationState);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();
  const sequence = useRef(0);
  const issueLock = useRef(false);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [issueMessage, setIssueMessage] = useState("");
  const refresh = useCallback(() => {
    const request = ++sequence.current;
    dispatch({ type: "start", request });
    startTransition(async () => {
      let result: DinnerVerificationResult;
      try { result = await refreshAction(eventId); }
      catch { result = { ok: false, code: "SYSTEM_ERROR" }; }
      dispatch({ type: "finish", request, result });
    });
  }, [eventId, refreshAction]);

  async function toggleIssued(participantId: string, currentlyIssued: boolean) {
    if (!issueAction || issueLock.current || state.pending || state.stale) return;
    if (currentlyIssued && !window.confirm("Clear this event's issued mark? Only do this to correct a recording mistake.")) return;
    issueLock.current = true; setIssuing(participantId); setIssueMessage("");
    try {
      const saved = await issueAction(eventId, participantId, !currentlyIssued, currentlyIssued);
      if (saved.ok) setIssueMessage(currentlyIssued ? "Issued mark cleared for this event." : "Dinner issuance saved for this event.");
      else setIssueMessage(saved.code === "REFRESH_REQUIRED" ? "Eligibility or serving status changed. Refresh and check before serving."
        : saved.code === "PERMISSION_DENIED" || saved.code === "UNAUTHENTICATED" ? "Your access changed. Sign in again before serving."
        : "The issued mark could not be confirmed. Refresh before retrying.");
      refresh();
    } catch { setIssueMessage("The issued mark could not be confirmed. Refresh before retrying."); refresh(); }
    finally { issueLock.current = false; setIssuing(null); }
  }

  useEffect(() => {
    const stale = () => dispatch({ type: "stale" });
    const visible = () => document.visibilityState === "visible" ? refresh() : stale();
    window.addEventListener("focus", refresh);
    window.addEventListener("blur", stale);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("blur", stale);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);

  useEffect(() => {
    const timeout = window.setTimeout(() => dispatch({ type: "stale" }), 60_000);
    return () => window.clearTimeout(timeout);
  }, [state.result]);

  const result = state.result;
  const query = search.trim().toLowerCase();
  const filtered = result.ok ? result.items.filter((item) =>
    `${item.participantName} ${item.participantEmail}`.toLowerCase().includes(query),
  ) : [];

  return (
    <section className="space-y-6" aria-label="Dinner verification" aria-busy={state.pending}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Dinner verification</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{result.ok ? result.event.name : "Verify dinner eligibility"}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Registered, checked-in participants matching the shared eligibility roster can collect dinner. Tick Issued after serving. Each event has its own serving record; standing eligibility is not consumed.</p>
        </div>
        <button type="button" onClick={refresh} disabled={state.pending} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:opacity-60">
          {state.pending ? "Refreshing…" : "Refresh eligibility"}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {issueMessage ? <p role="status" className="mb-3 rounded-xl border border-slate-200 p-4 text-sm">{issueMessage}</p> : null}
        {state.pending ? <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">Matching confirmed check-ins against the shared dinner eligibility roster… Please wait before serving.</p> : state.stale && result.ok ? (
          <p role={state.refreshFailed ? "alert" : "status"} className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            {state.refreshFailed ? "Refresh failed. The previous result is shown below." : "Attendance, registration or the shared roster may have changed since this check."} Refresh successfully before serving dinner.
          </p>
        ) : result.ok ? <p className="text-sm text-slate-600">Last checked {new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(result.readAt))} (Sydney). Refresh after any check-in, registration or shared roster change.</p> : null}
      </div>

      {!result.ok ? <DinnerFeedback code={result.code} /> : <>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-900">{state.stale ? "Previously eligible" : "Eligible for dinner"}</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-950">{result.eligibleCount} <span className="text-sm font-normal">matched attendees</span></p>
          <p className="mt-2 text-sm text-emerald-900">{result.items.filter(item => item.issuedAt).length} issued · {result.items.filter(item => item.eligibility === "Eligible" && !item.issuedAt).length} ready to collect</p>
        </div>
        <div>
          <label htmlFor="dinner-search" className="block text-sm font-semibold text-slate-800">Find a verified dinner attendee</label>
          <input id="dinner-search" type="search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="mt-2 w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-emerald-700" />
        </div>
        {result.items.length === 0 ? <p className="rounded-xl border border-slate-200 p-6 text-slate-600">No confirmed check-ins match the shared dinner eligibility roster for this event. Check registration, check-in and the matching email before serving.</p> : filtered.length === 0 ? <p role="status" className="rounded-xl border border-slate-200 p-6 text-slate-600">No matching verified attendees. Check the name or email, then confirm registration, check-in and shared roster membership.</p> : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Verified dinner attendees">
            {filtered.map((item) => <li key={item.participantId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="break-words font-semibold text-slate-900">{item.participantName}</p><p className="mt-1 break-all text-sm text-slate-600">{item.participantEmail}</p></div>
              <div className="space-y-2 text-sm">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                  <input type="checkbox" checked={Boolean(item.issuedAt)} aria-label={`Issued dinner to ${item.participantEmail}`}
                    disabled={!issueAction || Boolean(issuing) || state.pending || state.stale || (!item.issuedAt && item.eligibility !== "Eligible")}
                    onChange={() => void toggleIssued(item.participantId, Boolean(item.issuedAt))} className="size-5 accent-emerald-700" />
                  {issuing === item.participantId ? "Saving…" : item.issuedAt ? "Issued" : "Ready to collect"}
                </label>
                {item.issuedAt ? <p className="text-slate-600">Issued {new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", dateStyle: "short", timeStyle: "short" }).format(new Date(item.issuedAt))} (Sydney)</p> : null}
                {item.issuedAt && item.eligibility !== "Eligible" ? <p className="text-amber-900">Eligibility changed after serving. The issued record is retained.</p> : null}
              </div>
            </li>)}
          </ul>
        )}
        <p className="text-sm leading-6 text-slate-500">The shared roster grants ongoing eligibility across all events. This event also requires valid registration and confirmed attendance. Previously issued records remain visible if eligibility changes, so a correction cannot hide a meal already served.</p>
      </>}
    </section>
  );
}
