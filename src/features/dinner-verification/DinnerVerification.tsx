"use client";

import { useRef, useState } from "react";
import type { DinnerVerificationItem, DinnerVerificationResult } from "./contracts";
import { countDinnerEligibility } from "./eligibility-count";
import { DinnerFeedback } from "./DinnerFeedback";

type Props = Readonly<{
  eventId: string;
  initialResult: DinnerVerificationResult;
  issueAction?: (eventId: string, participantId: string, issued: boolean, expectedIssued: boolean) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; code: string }>>;
}>;

export function DinnerVerification({ eventId, initialResult, issueAction }: Props) {
  const [result, setResult] = useState(initialResult);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const issueLock = useRef(false);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [issueMessage, setIssueMessage] = useState("");
  async function toggleIssued(participantId: string, currentlyIssued: boolean) {
    if (!issueAction || issueLock.current) return;
    issueLock.current = true; setIssuing(participantId); setIssueMessage("");
    try {
      const saved = await issueAction(eventId, participantId, !currentlyIssued, currentlyIssued);
      if (saved.ok) {
        setResult(current => current.ok ? { ...current, items: current.items.map(item => item.participantId === participantId ? { ...item, issuedAt: currentlyIssued ? null : new Date().toISOString() } : item) } : current);
      }
      else setIssueMessage(saved.code === "REFRESH_REQUIRED" ? "Attendance or the saved mark changed. Reload the page before trying again."
        : saved.code === "PERMISSION_DENIED" || saved.code === "UNAUTHENTICATED" ? "Your access changed. Sign in again before serving."
        : "The mark could not be confirmed. Reload the page before retrying.");
    } catch { setIssueMessage("The mark could not be confirmed. Reload the page before retrying."); }
    finally { issueLock.current = false; setIssuing(null); }
  }

  const query = search.trim().toLowerCase();
  const filtered = result.ok ? result.items.filter(item =>
    `${item.participantName} ${item.participantEmail}`.toLowerCase().includes(query) &&
    (filter === "all" || (filter === "issued" ? Boolean(item.issuedAt) : !item.issuedAt)),
  ) : [];
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const control = "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";
  const row = (item: DinnerVerificationItem) => <li key={item.participantId} className={item.issuedAt ? "bg-emerald-50/40" : ""}>
    <label className="flex min-h-16 items-center justify-between gap-4 px-5 py-2 hover:bg-slate-50">
      <span className="min-w-0">
        <span className="block break-words font-semibold text-slate-950">{item.participantName}</span>
        <span className="block break-all text-sm text-slate-600">{item.participantEmail}</span>

      </span>
      <span className="flex min-h-11 shrink-0 items-center gap-3">
        <span className="text-sm text-slate-600">{issuing === item.participantId ? "Saving…" : ""}</span>
        <input type="checkbox" className="size-5 shrink-0 accent-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:opacity-50"
          checked={Boolean(item.issuedAt)} aria-label={`Issued dinner to ${item.participantEmail}`}
          disabled={!issueAction || Boolean(issuing)}
          onChange={() => void toggleIssued(item.participantId, Boolean(item.issuedAt))} />
      </span>
    </label>
  </li>;

  return <div className="space-y-5">
    <header className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dinner verification</h1>
      {result.ok ? <p className="break-words text-lg text-slate-700">{result.event.name}</p> : null}
    </header>
    {!result.ok ? <DinnerFeedback code={result.code} /> : <>
      <section aria-labelledby="dinner-list-heading" aria-busy={Boolean(issuing)} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <header className="space-y-1 border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 id="dinner-list-heading" className="text-xl font-semibold text-slate-950">Eligibility</h2>
              <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-emerald-900" aria-label={`Eligibility: ${countDinnerEligibility(result.items)}`} aria-live="polite" aria-atomic="true">{countDinnerEligibility(result.items)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-3 sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="dinner-search" className="sr-only">Search by name or email</label>
              <input id="dinner-search" type="search" autoComplete="off" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search by name or email" className={`${control} w-full`} />
            </div>
            <div>
              <label htmlFor="dinner-filter" className="sr-only">Dinner status</label>
              <select id="dinner-filter" value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }} className={`${control} w-full sm:w-44`}>
                <option value="all">All participants</option><option value="unmarked">Not eligible</option><option value="issued">Eligible</option>
              </select>
            </div>
          </div>
        </header>
        <div aria-live="polite" aria-atomic="true">
          {issueMessage ? <p role="status" className="px-5 pt-3 text-sm">{issueMessage}</p> : null}

        </div>
        {result.items.length === 0 ? <div className="p-5 text-sm text-slate-600">
          <p>No confirmed attendance for this event yet.</p>
        </div> : visible.length === 0 ? <p role="status" className="p-5 text-slate-600">No attendees match your search or filter.</p> : <ul aria-label="Confirmed attendees for dinner" className="divide-y divide-slate-100">{visible.map(row)}</ul>}
        {filtered.length > 0 ? <nav aria-label="Dinner pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
          <p role="status" className="text-sm text-slate-600">{(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, filtered.length)} of {filtered.length}</p>
          {pages > 1 ? <div className="flex items-center gap-3"><button type="button" className={`${control} disabled:opacity-40`} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span className="text-sm text-slate-600">{currentPage} / {pages}</span><button type="button" className={`${control} disabled:opacity-40`} disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>Next</button></div> : null}
        </nav> : null}
      </section>
    </>}
  </div>;
}
