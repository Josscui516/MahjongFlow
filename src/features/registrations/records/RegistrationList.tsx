import Link from "next/link";
import { REGISTRATION_PAGE_SIZE, type RegistrationListResult } from "./contracts";
import { registrationErrors } from "./messages";

export function RegistrationList({ result, onPage, searching = false, registrationCount }: Readonly<{
  result: RegistrationListResult;
  registrationCount?: number | null;
  onPage?: (page: number) => void;
  searching?: boolean;
}>) {
  if (!result.ok) return <p role="alert">{registrationErrors[result.code]}</p>;
  return <section aria-label="Registration records" className="space-y-4">
    <h2 className="flex flex-wrap items-center gap-2.5 text-xl font-semibold text-slate-950" tabIndex={-1}>Participants {typeof registrationCount === "number" ? <span aria-label={`${registrationCount} currently registered`} data-testid="registered-count" className="inline-flex min-w-8 items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-base font-semibold tabular-nums text-emerald-950">{registrationCount}</span> : registrationCount === null ? <span role="status" className="text-sm font-normal text-slate-500">Count unavailable</span> : null}</h2>
    {result.items.length === 0 ? <p>{searching ? "No registrations match your search. Try another name or email, or clear the search." : "No registrations on this page."}</p> : <ul tabIndex={0} aria-label="Participant names and emails" className="max-h-[28rem] divide-y divide-slate-200 overflow-y-auto overscroll-contain rounded-xl border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">
      {result.items.map((item) => <li key={item.id} className="grid min-w-0 gap-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:gap-6">
        <h3 className="font-semibold text-slate-950 [overflow-wrap:anywhere]">{item.participantName}</h3>
        <p className="text-slate-600 [overflow-wrap:anywhere]">{item.participantEmail}</p>
      </li>)}
    </ul>}
    {result.total > REGISTRATION_PAGE_SIZE && <nav aria-label="Registration pages" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm tabular-nums text-slate-500">Page <strong className="font-semibold text-slate-900">{result.page}</strong> of {Math.ceil(result.total / REGISTRATION_PAGE_SIZE)}</span>
      <div className="flex items-center gap-2">
        {result.page > 1 ? (onPage ? <button type="button" className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => onPage(result.page - 1)}>Previous page</button> : <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold" href={`/registrations/${result.eventId}?page=${result.page - 1}`}>Previous page</Link>) : <button type="button" disabled className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-400">Previous page</button>}
        {result.page * REGISTRATION_PAGE_SIZE < result.total ? (onPage ? <button type="button" className="min-h-11 rounded-lg bg-emerald-950 px-4 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => onPage(result.page + 1)}>Next page</button> : <Link className="inline-flex min-h-11 items-center rounded-lg bg-emerald-950 px-4 text-sm font-semibold text-white" href={`/registrations/${result.eventId}?page=${result.page + 1}`}>Next page</Link>) : <button type="button" disabled className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm text-slate-400">Next page</button>}
      </div>
    </nav>}
  </section>;
}
