import Link from "next/link";

import type { UpcomingEventsResult } from "./contracts";

export function UpcomingEventsPanel({ result }: Readonly<{ result: UpcomingEventsResult }>) {
  return (
    <section aria-labelledby="upcoming-events-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950" id="upcoming-events-heading">Upcoming events</h2>
      {result.state === "not_connected" ? (
        <p className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950" role="status">
          Upcoming events are not connected yet. Event information will appear here when available.
        </p>
      ) : result.state === "permission_denied" ? (
        <p className="mt-3 text-sm text-rose-800" role="alert">You do not have permission to view upcoming events.</p>
      ) : result.state === "error" ? (
        <p className="mt-3 text-sm text-rose-800" role="alert">Upcoming events could not be loaded. Try again later.</p>
      ) : result.events.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No upcoming events.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {result.events.map((event) => (
            <li className="rounded-xl bg-slate-50 p-4" key={event.id}>
              <Link className="font-semibold text-emerald-900 underline underline-offset-2" href={`/events/${encodeURIComponent(event.id)}`}>{event.name}</Link>
              <p className="mt-1 text-sm text-slate-600">{event.startsAt} · {event.location}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
