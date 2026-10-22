import { PermissionDeniedFeedback } from "@/components/feedback";
import { EventSort } from "@/features/events/list/EventSort";
import { EventDeleteButton } from "@/features/events/EventDeleteButton";
import Link from "next/link";
import { SystemErrorFeedback } from "@/components/feedback";
import { EventFilters } from "@/features/events/list/EventFilters";
import { EventStatusBadge } from "@/features/events/presentation";
import { browseEvents } from "@/features/events/list/service";
import { EVENT_PAGE_SIZE, defaultEventListParams, hasEventListFilters, eventListHref, readEventFilters, type EventSearchParams } from "@/features/events/list/filters";

const formatter = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" });

export default async function EventsPage({ searchParams }: Readonly<{ searchParams: Promise<EventSearchParams> }>) {
  const rawParams = await searchParams;
  const now = new Date();
  const params = defaultEventListParams(rawParams, now);
  const baseline = readEventFilters(defaultEventListParams({}, now)).filters;
  const upcoming = params !== rawParams;
  const { filters } = readEventFilters(params);
  const result = await browseEvents(params);
  return <div className="space-y-3">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-4"><div><h1 className="text-3xl font-bold text-slate-950">Events</h1><p className="mt-2 text-slate-600">Manage weekly sessions and tournaments.</p></div><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-950 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" href="/events/new"><svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /></svg>Create event</Link></header>
    <nav aria-label="Event views" className="flex gap-2 text-sm font-semibold"><Link href="/events" aria-current={upcoming ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-4 ${upcoming ? "bg-emerald-950 text-white" : "text-emerald-900 hover:bg-emerald-50"}`}>Upcoming</Link><Link href="/events?view=all" aria-current={!upcoming ? "page" : undefined} className={`inline-flex min-h-11 items-center rounded-lg px-4 ${!upcoming ? "bg-emerald-950 text-white" : "text-emerald-900 hover:bg-emerald-50"}`}>All events</Link></nav>
    <EventFilters hasActiveFilters={hasEventListFilters(filters, baseline.from)} filters={filters} expandDates={Boolean(rawParams.from || rawParams.to)} />
    {!result.ok ? result.code === "VALIDATION" ? <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-900">{result.message}</p> : result.code === "PERMISSION_DENIED" ? <PermissionDeniedFeedback /> : <SystemErrorFeedback /> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-sm font-semibold text-slate-800">Showing {result.items.length ? (filters.page - 1) * EVENT_PAGE_SIZE + 1 : 0}&ndash;{result.items.length ? (filters.page - 1) * EVENT_PAGE_SIZE + result.items.length : 0} of {result.total} {result.total === 1 ? "event" : "events"}</p><EventSort criteria={filters} /></div>
      {result.items.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{filters.page > 1 ? "No events on this page" : filters.q || filters.status || filters.from || filters.to ? "No matching events" : "No events yet"}</h2><p className="mt-2 text-sm text-slate-600">Change your filters or return to the first page.</p><Link className="inline-flex min-h-11 items-center font-semibold text-emerald-900 underline" href={eventListHref(filters, 1)}>First page</Link></div> : <ol className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">{result.items.map(event => <li key={event.id}><article className="grid items-center gap-4 p-5 hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_auto]"><div className="grid items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"><Link className="min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2" href={`/events/${event.id}`}><span className="min-w-0 [overflow-wrap:anywhere]"><span className="mb-1 flex flex-wrap items-center gap-2"><strong className="text-slate-950">{event.name}</strong><EventStatusBadge status={event.status} /></span><span className="text-sm text-slate-600">{event.eventType === "weekly_session" ? "Weekly session" : "Tournament"} · {event.location}</span></span></Link><time className="text-sm font-semibold text-emerald-900" dateTime={event.startsAt}>{formatter.format(new Date(event.startsAt))}</time></div><div className="flex flex-wrap gap-2"><Link className="inline-flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/events/${event.id}`} aria-label={`Open event: ${event.name}`}>Open event</Link><EventDeleteButton eventId={event.id} eventTitle={event.name} successHref={eventListHref(filters)} /></div></article></li>)}</ol>}
      <nav aria-label="Event pages" className="flex flex-wrap gap-4 text-sm font-semibold text-emerald-900">{filters.page > 1 ? <Link className="inline-flex min-h-11 items-center underline" href={eventListHref(filters, filters.page - 1)}>Previous page</Link> : null}{filters.page * EVENT_PAGE_SIZE < result.total ? <Link className="inline-flex min-h-11 items-center underline" href={eventListHref(filters, filters.page + 1)}>Next page</Link> : null}</nav>
    </>}
  </div>;
}
