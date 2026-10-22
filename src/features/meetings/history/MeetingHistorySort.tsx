"use client";

import type { MeetingHistoryCriteria } from "./contracts";

export function MeetingHistorySort({ criteria }: Readonly<{ criteria: MeetingHistoryCriteria }>) {
  return <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600">Sort by
    <select key={criteria.sort} form="meeting-filters" onChange={(event) => event.currentTarget.form?.requestSubmit()} className="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" defaultValue={criteria.sort} name="sort">
      <option value="newest">Meeting date: latest first</option><option value="oldest">Meeting date: earliest first</option>
    </select>
  </label>;
}
