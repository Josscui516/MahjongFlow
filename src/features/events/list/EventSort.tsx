"use client";

import { EVENT_SORTS, type EventFilters } from "./filters";

export function EventSort({ criteria }: Readonly<{ criteria: EventFilters }>) {
  return <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600">Sort by
    <select key={criteria.sort} form="event-filters" onChange={(event) => event.currentTarget.form?.requestSubmit()} className="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" defaultValue={criteria.sort} name="sort">
      {Object.entries(EVENT_SORTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
  </label>;
}
