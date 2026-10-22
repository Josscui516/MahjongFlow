"use client";

import type { TaskListCriteria } from "./search-params";

export function TaskSort({ criteria }: Readonly<{ criteria: TaskListCriteria }>) {
  return <label className="flex min-w-0 items-center gap-2 text-sm text-slate-600">Sort by
    <select key={criteria.sort} form="task-filters" onChange={(event) => event.currentTarget.form?.requestSubmit()} className="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" defaultValue={criteria.sort} name="sort">
      <option value="due_soonest">Due date: earliest first</option><option value="due_latest">Due date: latest first</option><option value="updated_recent">Last updated: newest first</option>
    </select>
  </label>;
}
