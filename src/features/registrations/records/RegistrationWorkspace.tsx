"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function RegistrationWorkspace({ records, form, initiallyEmpty }: Readonly<{ records: ReactNode; form: ReactNode; initiallyEmpty: boolean }>) {
  const [adding, setAdding] = useState(initiallyEmpty);
  const panelRef = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  useEffect(() => {
    if (interacted.current) panelRef.current?.querySelector<HTMLElement>(adding ? "#registration-entry h2" : "#registration-records h2")?.focus();
  }, [adding]);
  return <div ref={panelRef} className="space-y-4">
    <div className="flex gap-2 lg:hidden" role="group" aria-label="Registration view">
      {[false, true].map(value => <button key={String(value)} type="button" aria-pressed={adding === value} aria-controls={value ? "registration-entry" : "registration-records"} onClick={() => { interacted.current = true; setAdding(value); }} className={`min-h-11 flex-1 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 ${adding === value ? "border-emerald-950 bg-emerald-950 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{value ? "Add registration" : "Registration records"}</button>)}
    </div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.85fr)]">
      <div id="registration-records" className={adding ? "hidden min-w-0 lg:block" : "min-w-0"}>{records}</div>
      <div id="registration-entry" className={adding ? "min-w-0" : "hidden min-w-0 lg:block"}>{form}</div>
    </div>
  </div>;
}
