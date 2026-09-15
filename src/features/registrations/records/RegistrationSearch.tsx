"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { RegistrationListResult, RegistrationMutationPort } from "./contracts";
import { RegistrationList } from "./RegistrationList";
import { searchRegistrations } from "./actions";

export function RegistrationSearch({ initialResult, eventId, changeStatus }: Readonly<{ initialResult: RegistrationListResult; eventId: string; changeStatus: RegistrationMutationPort["changeStatus"] }>) {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState(initialResult);
  const [pending, setPending] = useState(false);
  const [searching, setSearching] = useState(false);
  const applied = useRef({ text: "", page: initialResult.ok ? initialResult.page : 1 });
  const version = useRef(0);
  const previousInitial = useRef(initialResult);
  const feedback = useRef<HTMLDivElement>(null);
  const interacted = useRef(false);
  const load = useCallback(async (text: string, page: number) => {
    const request = ++version.current;
    applied.current = { text, page };
    setPending(true);
    setSearching(Boolean(text));
    try {
      const response = await searchRegistrations(eventId, page, text);
      if (request === version.current) setResult(response);
    } catch {
      if (request === version.current) setResult({ ok: false, code: "SYSTEM_ERROR" });
    } finally { if (request === version.current) setPending(false); }
  }, [eventId]);
  useEffect(() => {
    if (previousInitial.current !== initialResult) {
      previousInitial.current = initialResult;
      // New registrations and status changes refresh the active search as well as totals.
      void load(applied.current.text, applied.current.page);
    }
  }, [initialResult, load]);
  useEffect(() => () => { version.current++; }, []);
  useEffect(() => {
    if (interacted.current && !pending) feedback.current?.focus();
  }, [result, pending]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    interacted.current = true;
    void load(draft.trim(), 1);
  }
  return <div className="min-w-0 space-y-4">
    <form role="search" aria-label="Search registrations" className="space-y-3" onSubmit={submit}>
      <label className="grid gap-2 text-sm font-semibold" htmlFor="registration-search">Search by name or email<input id="registration-search" type="search" autoComplete="off" maxLength={100} aria-describedby="registration-search-help" value={draft} onChange={event => setDraft(event.target.value)} className="min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" /></label>
      <p id="registration-search-help" className="text-sm text-slate-600">Search all registration records for this event. Totals above always describe the whole event.</p>
      <div className="flex flex-wrap gap-3"><button disabled={pending} className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">{pending ? "Searching…" : "Search records"}</button><button type="button" disabled={pending} className="min-h-11 px-3 text-sm font-semibold text-emerald-900 underline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50" onClick={() => { setDraft(""); interacted.current = true; void load("", 1); }}>Clear search</button></div>
    </form>
    <div ref={feedback} tabIndex={-1} role="status" aria-live="polite" className="rounded-sm text-sm text-slate-600 focus-visible:outline-2 focus-visible:outline-offset-2">{pending ? "Searching registration records…" : result.ok ? `${result.total} ${result.total === 1 ? "record" : "records"} found. Page ${result.page}.` : "Search could not be completed. Try again."}</div>
    <fieldset disabled={pending} aria-busy={pending} className="min-w-0"><legend className="sr-only">Registration search results</legend><RegistrationList result={result} changeStatus={changeStatus} searching={searching} onPage={page => { interacted.current = true; void load(applied.current.text, page); }} /></fieldset>
  </div>;
}
