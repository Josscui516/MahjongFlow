"use client";

import { useCallback, useEffect, useReducer, useRef, useState, useTransition } from "react";
import type { DinnerVerificationResult } from "./contracts";
import { DinnerFeedback } from "./DinnerFeedback";
import { initialVerificationState, verificationReducer } from "./refresh-state";

type Props = Readonly<{
  eventId: string;
  initialResult: DinnerVerificationResult;
  refreshAction: (eventId: string) => Promise<DinnerVerificationResult>;
}>;

export function DinnerVerification({ eventId, initialResult, refreshAction }: Props) {
  const [state, dispatch] = useReducer(verificationReducer, initialResult, initialVerificationState);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();
  const sequence = useRef(0);
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
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Dinner eligibility comes only from the administrator-preloaded roster for this event. Registration and attendance do not grant eligibility.</p>
        </div>
        <button type="button" onClick={refresh} disabled={state.pending} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:opacity-60">
          {state.pending ? "Refreshing…" : "Refresh eligibility"}
        </button>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {state.pending ? <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">Checking the current dinner roster… Please wait before serving.</p> : state.stale && result.ok ? (
          <p role={state.refreshFailed ? "alert" : "status"} className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            {state.refreshFailed ? "Refresh failed. The previous result is shown below." : "The dinner roster may have changed since this check."} Refresh successfully before serving dinner.
          </p>
        ) : result.ok ? <p className="text-sm text-slate-600">Last checked {new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(result.readAt))} (Sydney). Refresh after any dinner roster change.</p> : null}
      </div>

      {!result.ok ? <DinnerFeedback code={result.code} /> : <>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-900">{state.stale ? "Previously eligible" : "Eligible for dinner"}</p>
          <p className="mt-1 text-3xl font-semibold text-emerald-950">{result.eligibleCount} <span className="text-sm font-normal">of {result.items.length} roster entries</span></p>
        </div>
        <div>
          <label htmlFor="dinner-search" className="block text-sm font-semibold text-slate-800">Find a dinner roster member</label>
          <input id="dinner-search" type="search" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="mt-2 w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus-visible:outline-2 focus-visible:outline-emerald-700" />
        </div>
        {result.items.length === 0 ? <p className="rounded-xl border border-slate-200 p-6 text-slate-600">The administrator has not added any dinner roster entries for this event.</p> : filtered.length === 0 ? <p role="status" className="rounded-xl border border-slate-200 p-6 text-slate-600">No matching roster entries. Check the name or email. A person outside the active dinner roster is Not Eligible Yet.</p> : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white" aria-label="Dinner roster">
            {filtered.map((item) => <li key={item.participantId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="break-words font-semibold text-slate-900">{item.participantName}</p><p className="mt-1 break-all text-sm text-slate-600">{item.participantEmail}</p></div>
              <span className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${state.stale ? "bg-slate-100 text-slate-600" : item.eligibility === "Eligible" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-950"}`}>
                {state.stale ? `Previous: ${item.eligibility}` : item.eligibility}
              </span>
            </li>)}
          </ul>
        )}
        <p className="text-sm leading-6 text-slate-500">This list is maintained in advance by an administrator. Active roster members are eligible regardless of activity registration or attendance. Removed members are not eligible.</p>
      </>}
    </section>
  );
}
