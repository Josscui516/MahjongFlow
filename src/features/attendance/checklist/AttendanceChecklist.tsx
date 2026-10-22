"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ManualAttendanceAction } from "../manual/contracts";
import type { AttendanceChecklistRow } from "./contracts";
import { attendanceChange, checklistPage } from "./projection";

export function AttendanceChecklist({ rows, confirmedCount, action }: Readonly<{
  rows: readonly AttendanceChecklistRow[];
  confirmedCount: number | null;
  action: ManualAttendanceAction;
}>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lock = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unmarked" | "confirmed">("all");
  const [page, setPage] = useState(1);
  const view = checklistPage(rows, search, filter, page);

  function mark(row: AttendanceChecklistRow, checked: boolean) {
    if (lock.current || pending) return;
    lock.current = true;
    setError(null);
    startTransition(async () => {
      try {
        const result = await action({ status: "idle" }, attendanceChange(row, checked));
        if (result.status === "success") {
          router.refresh();
        } else {
          const message = result.status === "permission-denied" ? "You do not have permission to change attendance."
            : result.status === "unauthenticated" ? "Sign in again to mark attendance."
            : result.status === "conflict" || result.status === "duplicate" ? "Attendance has changed. The list is being refreshed; review it before trying again."
            : "Attendance could not be saved. Refresh the list and try again.";
          setError(message);
          router.refresh();
        }
      } catch {
        setError("Attendance could not be saved. Refresh the list before trying again.");
        router.refresh();
      } finally {
        lock.current = false;
      }
    });
  }

  return <div className="space-y-5">
    <section aria-labelledby="attendance-list-heading" className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <header className="space-y-1 border-b border-slate-200 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="attendance-list-heading" className="text-xl font-semibold text-slate-950">Mark attendance</h2>
          {confirmedCount === null ? <p role="alert" className="text-sm text-slate-600">Attendance total unavailable. Refresh to try again.</p>
            : <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold tabular-nums text-emerald-900" title="Confirmed attendance" aria-label={`Confirmed attendance: ${confirmedCount}`} data-testid="attendance-count" aria-live="polite" aria-atomic="true">{confirmedCount}</span>}
        </div>
        <div className="flex flex-col gap-3 pt-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <label htmlFor="attendance-search" className="sr-only">Search by name or email</label>
            <input id="attendance-search" type="search" placeholder="Search by name or email" autoComplete="off" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" />
          </div>
          <div>
            <label htmlFor="attendance-filter" className="sr-only">Attendance status</label>
            <select id="attendance-filter" value={filter} onChange={event => { setFilter(event.target.value as typeof filter); setPage(1); }} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-44">
              <option value="all">All participants</option>
              <option value="unmarked">Not marked</option>
              <option value="confirmed">Confirmed</option>
            </select>
          </div>
        </div>
      </header>
      {error && <p role="alert" className="mx-5 mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
      {rows.length === 0 ? <p className="p-5 text-slate-600">No registered participants for this event yet.</p>
        : view.items.length === 0 ? <p className="p-5 text-slate-600">No participants match your search or filter.</p>
        : <ul className="divide-y divide-slate-100" aria-busy={pending}>
          {view.items.map(row => <li key={row.id}>
            <label className={`flex min-h-16 cursor-pointer items-center justify-between gap-4 px-5 py-2 transition-colors hover:bg-slate-50 ${row.attendance?.status === "confirmed" ? "bg-emerald-50/40" : ""}`}>
              <span className="min-w-0">
                <span className="block font-semibold text-slate-950">{row.name}</span>
                <span className="block break-all text-sm text-slate-600">{row.email}</span>
              </span>
              <span className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-3">
                <input type="checkbox" className="size-5 shrink-0 rounded border-slate-300 accent-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-50"
                  aria-label={`Mark attendance for ${row.name}`}
                  checked={row.attendance?.status === "confirmed"} disabled={pending}
                  onChange={event => mark(row, event.target.checked)} />
              </span>
            </label>
          </li>)}
        </ul>}
      {view.total > 0 && <nav aria-label="Attendance pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
        <p role="status" className="text-sm text-slate-600">{view.start}–{view.end} of {view.total}</p>
        {view.pages > 1 && <div className="flex items-center gap-3">
          <button type="button" disabled={view.page === 1} onClick={() => setPage(view.page - 1)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold disabled:opacity-40">Previous</button>
          <span className="text-sm text-slate-600">{view.page} / {view.pages}</span>
          <button type="button" disabled={view.page === view.pages} onClick={() => setPage(view.page + 1)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold disabled:opacity-40">Next</button>
        </div>}
      </nav>}
    </section>
  </div>;
}
