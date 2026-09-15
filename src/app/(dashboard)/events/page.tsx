import Link from "next/link";
import { SystemErrorFeedback } from "@/components/feedback";
import { EVENT_STATUSES } from "@/features/events/core/contracts";
import { EventStatusBadge, EVENT_STATUS_LABELS } from "@/features/events/presentation";
import { browseEvents } from "@/features/events/list/service";
import { EVENT_PAGE_SIZE, eventListHref, readEventFilters, type EventSearchParams } from "@/features/events/list/filters";

const formatter = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" });
const control = "min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";
export default async function EventsPage({ searchParams }: Readonly<{ searchParams: Promise<EventSearchParams> }>) {
  const params = await searchParams;
  const { filters } = readEventFilters(params);
  const result = await browseEvents(params);
  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-7"><div><h1 className="text-3xl font-bold text-slate-950">Events</h1><p className="mt-2 text-slate-600">Manage weekly sessions and tournaments.</p></div><Link className="inline-flex min-h-11 items-center rounded-lg bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" href="/events/new">Create event</Link></header>
    <form action="/events" className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" role="search" aria-label="Filter events">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold">Search by name<input className={control} name="q" type="search" maxLength={100} defaultValue={filters.q} /></label>
        <label className="grid gap-2 text-sm font-semibold">Status<select className={control} name="status" defaultValue={filters.status}><option value="">All statuses</option>{EVENT_STATUSES.map(status => <option key={status} value={status}>{EVENT_STATUS_LABELS[status]}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-semibold">From date<input className={control} name="from" type="date" defaultValue={filters.from} aria-describedby="event-date-help" /></label>
        <label className="grid gap-2 text-sm font-semibold">To date<input className={control} name="to" type="date" defaultValue={filters.to} aria-describedby="event-date-help" /></label>
      </div>
      <p id="event-date-help" className="text-sm text-slate-600">Both dates are inclusive and use Sydney time.</p>
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2" type="submit">Apply filters</button><Link className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-emerald-900 underline focus-visible:outline-2 focus-visible:outline-offset-2" href="/events">Clear filters</Link></div>
    </form>
    {!result.ok ? result.code === "VALIDATION" ? <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-900">{result.message}</p> : result.code === "PERMISSION_DENIED" ? <p role="alert">You do not have permission to view events.</p> : <SystemErrorFeedback /> : <>
      <p role="status" className="text-sm text-slate-600">{result.total} {result.total === 1 ? "event" : "events"} found · Earliest first · Page {filters.page}</p>
      {result.items.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{filters.page > 1 ? "No events on this page" : filters.q || filters.status || filters.from || filters.to ? "No matching events" : "No events yet"}</h2><p className="mt-2 text-sm text-slate-600">Change your filters or return to the first page.</p><Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" href={eventListHref(filters, 1)}>First page</Link></div> : <ol className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">{result.items.map(event => <li key={event.id}><Link className="grid gap-3 p-5 hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[minmax(0,1fr)_auto]" href={`/events/${event.id}`}><span className="min-w-0 [overflow-wrap:anywhere]"><span className="mb-1 flex flex-wrap items-center gap-2"><strong className="text-slate-950">{event.name}</strong><EventStatusBadge status={event.status} /></span><span className="text-sm text-slate-600">{event.eventType === "weekly_session" ? "Weekly session" : "Tournament"} · {event.location}</span></span><time className="text-sm font-semibold text-emerald-900" dateTime={event.startsAt}>{formatter.format(new Date(event.startsAt))}</time></Link></li>)}</ol>}
      <nav aria-label="Event pages" className="flex flex-wrap gap-4 text-sm font-semibold text-emerald-900">{filters.page > 1 ? <Link className="inline-flex min-h-11 items-center underline" href={eventListHref(filters, filters.page - 1)}>Previous page</Link> : null}{filters.page * EVENT_PAGE_SIZE < result.total ? <Link className="inline-flex min-h-11 items-center underline" href={eventListHref(filters, filters.page + 1)}>Next page</Link> : null}</nav>
    </>}
  </div>;
}
