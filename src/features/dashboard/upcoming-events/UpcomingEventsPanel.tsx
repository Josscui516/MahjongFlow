import Link from "next/link";
import type { UpcomingEventsResult } from "./contracts";

const SYDNEY_FORMATTER = new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" });

export function UpcomingEventsPanel({ result }: Readonly<{ result: UpcomingEventsResult }>) {
  return <section aria-labelledby="upcoming-events-heading" className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <h2 className="text-lg font-bold text-slate-950" id="upcoming-events-heading">Events overview</h2>
    <p className="mt-4 text-xs text-slate-600">{result.state === "ready" ? `${result.events.length} upcoming ${result.events.length === 1 ? "event" : "events"} · Sydney time` : "Scheduled events · Sydney time"}</p>
    {result.state === "not_connected" ? <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950" role="status">Upcoming events are not connected yet.</p>
      : result.state === "permission_denied" ? <p className="mt-3 text-sm text-rose-800" role="alert">You do not have permission to view upcoming events.</p>
      : result.state === "error" ? <p className="mt-3 text-sm text-rose-800" role="alert">Upcoming events could not be loaded. Try again later.</p>
      : result.events.length === 0 ? <div className="mt-2"><h3 className="text-xl font-bold text-slate-950">No upcoming events.</h3><p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Scheduled events will appear here. You can browse past events or plan a new one.</p></div>
      : <ul className="mt-2 divide-y divide-slate-100">{result.events.slice(0, 3).map((event) => <li className="py-3" key={event.id}><Link className="block break-words rounded-sm py-1 text-sm font-semibold text-emerald-950 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link><p className="mt-1 text-xs leading-5 text-slate-600"><time dateTime={event.startsAt}>{SYDNEY_FORMATTER.format(new Date(event.startsAt))}</time> · {event.location}</p></li>)}</ul>}
    {result.state === "ready" && result.events.length > 3 ? <p className="mt-3 text-xs text-slate-600">Showing the next 3 of {result.events.length} events.</p> : null}
    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4"><Link href="/events" className="inline-flex min-h-11 items-center rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700">View all events</Link></div>
  </section>;
}
