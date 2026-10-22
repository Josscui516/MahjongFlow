import Link from "next/link";
import { listEvents } from "@/features/events/core";
import { DinnerFeedback } from "@/features/dinner-verification/DinnerFeedback";
import { AuthorizationError, requireAuthorised } from "@/lib/auth/authorization";

export default async function DinnerEventsPage() {
  // Layouts and pages can execute independently. Authorise before even listing
  // event choices in this protected namespace.
  try { await requireAuthorised(); }
  catch (error) { return <DinnerFeedback code={error instanceof AuthorizationError ? error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" : "PERMISSION_DENIED" : "SYSTEM_ERROR"} />; }
  const result = await listEvents();
  return <section className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Authorised staff</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Dinner verification</h1><p className="mt-3 text-slate-600">Choose an event to distribute dinner to checked-in members of the shared eligibility roster and record meals issued.</p></header>
    {!result.ok ? <DinnerFeedback code={result.code} /> : result.items.length === 0 ? <p>No events available for verification.</p> : <ul className="grid gap-4 sm:grid-cols-2">
      {result.items.map((event) => <li key={event.id}><Link prefetch={false} href={`/dinner-verification/${event.id}`} className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-emerald-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">
        <h2 className="font-semibold text-slate-900">{event.name}</h2><p className="mt-2 text-sm text-slate-600">{new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", dateStyle: "medium", timeStyle: "short" }).format(new Date(event.startsAt))} · Sydney</p><p className="mt-4 text-sm font-semibold text-emerald-700">Verify dinner eligibility →</p>
      </Link></li>)}
    </ul>}
  </section>;
}
