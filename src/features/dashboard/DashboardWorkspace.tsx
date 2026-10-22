"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import type { DashboardTaskSectionKey } from "./contracts";

type Tab = Readonly<{
  key: DashboardTaskSectionKey;
  title: string;
  label: string;
  scope: string;
  total: number | null;
  content: ReactNode;
}>;

export function DashboardWorkspace({ tabs, events }: Readonly<{ tabs: readonly Tab[]; events: ReactNode }>) {
  const [active, setActive] = useState(tabs[0]?.key);
  const tabRefs = useRef<Partial<Record<DashboardTaskSectionKey, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const syncHash = () => {
      const match = tabs.find(tab => `#dashboard-${tab.key}` === window.location.hash);
      if (match) setActive(match.key);
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [tabs]);

  function select(key: DashboardTaskSectionKey) {
    setActive(key);
    window.history.replaceState(null, "", `#dashboard-${key}`);
  }

  return <>
    <nav aria-label="Task summaries" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tabs.map(tab => <a key={tab.key} href={`#dashboard-${tab.key}`} aria-controls={`dashboard-${tab.key}`} onClick={event => {
        event.preventDefault();
        select(tab.key);
        tabRefs.current[tab.key]?.focus();
      }} className={`flex min-h-20 flex-col justify-between rounded-xl border p-4 motion-safe:transition-colors hover:border-emerald-700 hover:ring-2 hover:ring-emerald-700/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${tab.key === "overdue" && tab.total !== null && tab.total > 0 ? "border-rose-200 bg-rose-50 text-rose-950" : "border-slate-200 bg-white text-slate-900 hover:bg-emerald-50"}`}>
        <span className="text-xs font-medium">{tab.title}</span><span className="mt-1 text-2xl font-semibold tabular-nums">{tab.total ?? "Unavailable"}</span>
      </a>)}
    </nav>
    <p className="mt-2 text-xs text-slate-600">Groups can overlap. Overdue and due soon include all committee tasks. Deadlines use Sydney time.</p>
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-2">
      <section aria-labelledby="task-overview-heading" className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 id="task-overview-heading" className="text-lg font-bold text-slate-950">Task overview</h2>
        <div role="tablist" aria-label="Task groups" className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-4">
          {tabs.map((tab, index) => <button key={tab.key} ref={element => { tabRefs.current[tab.key] = element; }} type="button" role="tab" id={`tab-${tab.key}`} aria-selected={active === tab.key} aria-controls={`dashboard-${tab.key}`} tabIndex={active === tab.key ? 0 : -1} onClick={() => select(tab.key)} onKeyDown={event => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
            else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = tabs.length - 1;
            else return;
            event.preventDefault();
            select(tabs[next].key);
            tabRefs.current[tabs[next].key]?.focus();
          }} className={`min-h-11 rounded-md px-2 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${active === tab.key ? "bg-emerald-900 text-white" : "text-slate-600 hover:bg-white hover:text-emerald-950"}`}>{tab.label}{" "}<span className="ml-1 text-xs opacity-80">{tab.total ?? "—"}</span></button>)}
        </div>
        {tabs.map(tab => <div key={tab.key} role="tabpanel" id={`dashboard-${tab.key}`} aria-labelledby={`tab-${tab.key}`} tabIndex={0} hidden={active !== tab.key} className="mt-4 min-w-0 scroll-mt-6 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
          <p className="mb-2 text-xs text-slate-600">{tab.scope}</p>
          {tab.content}
        </div>)}
        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <Link href="/tasks" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">View all tasks</Link>
        </div>
      </section>
      {events}
    </div>
  </>;
}
