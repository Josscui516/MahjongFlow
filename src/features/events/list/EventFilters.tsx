"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { EVENT_STATUSES } from "../core/contracts";
import { EVENT_STATUS_LABELS } from "../presentation";
import { eventListHref, readEventFilters, type EventFilters as Criteria } from "./filters";

const control = "min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

export function EventFilters({ filters, expandDates, hasActiveFilters }: Readonly<{ filters: Criteria; expandDates: boolean; hasActiveFilters: boolean }>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);
  const appliedHref = eventListHref(filters);
  const requested = useRef(appliedHref);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [datesOpen, setDatesOpen] = useState(expandDates);

  function cancelTimer() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!pending && !timer.current && appliedHref !== requested.current) {
      for (const name of ["q", "status", "from", "to", "sort"] as const) {
        const field = formRef.current?.elements.namedItem(name);
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) field.value = filters[name];
      }
      setError("");
      requested.current = appliedHref;
    }
  }, [appliedHref, filters, pending]);

  function update(form: HTMLFormElement, delay = 0) {
    cancelTimer();
    const navigate = () => {
      timer.current = null;
      const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      const next = readEventFilters(data);
      if (next.error) { setError(next.error); return; }
      setError("");
      const href = eventListHref(next.filters, 1);
      requested.current = href;
      startTransition(() => router.replace(href, { scroll: false }));
    };
    if (delay) timer.current = setTimeout(navigate, delay);
    else navigate();
  }
  function changed(event: FormEvent<HTMLFormElement>) {
    if (composing.current) return;
    const field = event.target as HTMLInputElement | HTMLSelectElement;
    if (field.type !== "date") update(event.currentTarget, field.name === "q" ? 300 : 0);
  }
  const active = [
    filters.q ? `Search: ${filters.q}` : null,
    filters.status ? `Status: ${EVENT_STATUS_LABELS[filters.status]}` : null,
    filters.from ? `From: ${filters.from}` : null,
    filters.to ? `To: ${filters.to}` : null,
  ].filter(Boolean);
  return (
    <form id="event-filters" ref={formRef} onChange={changed} onInput={event => { const field = event.target as HTMLInputElement; if (field.type === "date" && field.validity.valid) update(event.currentTarget); }} onSubmit={event => { event.preventDefault(); update(event.currentTarget); }} onCompositionStart={() => { composing.current = true; cancelTimer(); }} onCompositionEnd={event => { composing.current = false; update(event.currentTarget, 300); }} aria-busy={pending} action="/events" method="get" className="space-y-2 rounded-xl border border-slate-200 bg-white p-4" role="search" aria-label="Filter events">
      <input type="hidden" name="view" value="all" /><div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(140px,0.5fr)]">
        <label className="grid gap-2 text-sm font-semibold">Search by name<input className={control} name="q" type="search" maxLength={100} defaultValue={filters.q} /></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select className={control} name="status" defaultValue={filters.status}><option value="">All statuses</option>{EVENT_STATUSES.map(status => <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>)}</select></label>
      </div>
      <details open={datesOpen} onToggle={event => setDatesOpen(event.currentTarget.open)}><summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-emerald-900 underline focus-visible:outline-2 focus-visible:outline-offset-2">Date range{filters.from || filters.to ? " (active)" : ""}</summary><div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">From date<input className={control} name="from" type="date" defaultValue={filters.from} aria-describedby="event-date-help" /></label>
        <label className="grid gap-2 text-sm font-semibold">To date<input className={control} name="to" type="date" defaultValue={filters.to} aria-describedby="event-date-help" /></label>
      </div><p id="event-date-help" className="mt-2 text-sm text-slate-600">Both dates are inclusive and use Sydney time.</p></details>
      {hasActiveFilters ? <div className="clear-both mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3" aria-label="Active event filters">{active.map(filter => <span key={filter} className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{filter}</span>)}<Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href="/events" onClick={() => { cancelTimer(); requested.current = ""; setError(""); setDatesOpen(false); }}>Clear all</Link></div> : null}
      {error ? <p role="alert" className="text-sm text-rose-800">{error}</p> : null}
      <p role="status" className="sr-only">{pending ? "Updating events" : ""}</p>
    </form>
  );
}
