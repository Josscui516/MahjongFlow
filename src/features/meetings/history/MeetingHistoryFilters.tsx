"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type FormEvent } from "react";
import type { MeetingHistoryCriteria } from "./contracts";
import { buildMeetingHistoryHref, hasMeetingHistoryFilters, parseMeetingHistorySearchParams } from "./search-params";

const CONTROL_CLASS =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200";

export function MeetingHistoryFilters({
  criteria,
}: Readonly<{ criteria: MeetingHistoryCriteria }>) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const composing = useRef(false);
  const requested = useRef(buildMeetingHistoryHref(criteria));
  const [pending, startTransition] = useTransition();
  const appliedHref = buildMeetingHistoryHref(criteria);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!pending && appliedHref !== requested.current) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      const values = { q: criteria.search, time: criteria.time, sort: criteria.sort };
      for (const [name, value] of Object.entries(values)) {
        const control = formRef.current?.elements.namedItem(name);
        if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.value = value;
      }
      requested.current = appliedHref;
    }
  }, [appliedHref, criteria, pending]);

  function update(form: HTMLFormElement, delay = 0) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const navigate = () => {
      timer.current = null;
      const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
      const next = parseMeetingHistorySearchParams(data);
      const href = buildMeetingHistoryHref(next, 1);
      requested.current = href;
      startTransition(() => router.replace(href, { scroll: false }));
    };
    if (delay) timer.current = setTimeout(navigate, delay);
    else navigate();
  }

  function changed(event: FormEvent<HTMLFormElement>) {
    if (composing.current) return;
    const control = event.target as HTMLInputElement | HTMLSelectElement;
    update(event.currentTarget, control.name === "q" ? 300 : 0);
  }

  const hasFilters = hasMeetingHistoryFilters(criteria);
  const active = [
    criteria.search ? `Search: ${criteria.search}` : null,
    criteria.time !== "all" ? `Meeting date: ${criteria.time === "past" ? "Past" : "Upcoming"}` : null,
    criteria.sort !== "newest" ? "Sort: Meeting date: earliest first" : null,
  ].filter(Boolean);

  return (
    <form
      id="meeting-filters"
      ref={formRef}
      aria-busy={pending}
      onChange={changed}
      onSubmit={(event) => { event.preventDefault(); update(event.currentTarget); }}
      onCompositionStart={() => {
        composing.current = true;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
      }}
      onCompositionEnd={(event) => { composing.current = false; update(event.currentTarget, 300); }}
      action="/meetings"
      aria-label="Search and filter meetings"
      className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
      method="get"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_11rem] xl:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800 sm:col-span-2 xl:col-span-1">
          Search by title
          <input
            className={CONTROL_CLASS}
            defaultValue={criteria.search}
            maxLength={100}
            name="q"
            placeholder="e.g. Event planning"
            type="search"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
          Meeting date
          <select className={CONTROL_CLASS} defaultValue={criteria.time} name="time">
            <option value="all">All meetings</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>




      </div>
      {hasFilters ? <div className="clear-both mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3" aria-label="Active meeting filters">{active.map(filter => <span key={filter} className="max-w-full break-words rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{filter}</span>)}<Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href="/meetings" onClick={() => { if (timer.current) clearTimeout(timer.current); timer.current = null; requested.current = ""; }}>Clear all</Link></div> : null}
      <p className="sr-only" role="status">{pending ? "Updating meetings" : ""}</p>
    </form>
  );
}
