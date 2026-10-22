import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SystemErrorFeedback } from "@/components/feedback";
import { requireBackendUser } from "@/lib/auth/authorization";
import { getEvent } from "@/features/events/core/service";
import { EventStatusBadge } from "@/features/events/presentation";
import { EventPreparationSection } from "@/features/events/preparation/EventPreparationSection";
import { EventParticipationSection } from "@/features/registrations/attendance-summary/EventParticipationSection";
import { ParticipationSummary } from "@/features/registrations/attendance-summary/ParticipationSummary";
import { canManageEventQr, EventCheckInTokenSection } from "@/features/attendance/tokens";

const formatter = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Sydney" });
export default async function EventPage({ params, searchParams }: Readonly<{ params: Promise<{ eventId: string }>; searchParams: Promise<{ saved?: string; preparation?: string }> }>) {
  const [{ eventId }, query] = await Promise.all([params, searchParams]);
  const result = await getEvent(eventId);
  if (!result.ok) { if (result.code === "NOT_FOUND") notFound(); return <SystemErrorFeedback />; }
  const event = result.record;
  const access = await requireBackendUser();
  return <div className="space-y-5">
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2" href="/events">Back to events</Link>
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-3"><h1 className="min-w-0 break-words text-3xl font-bold tracking-tight text-slate-950">{event.name}</h1><EventStatusBadge status={event.status} /></div>
      <p className="text-sm text-slate-600">{event.eventType === "weekly_session" ? "Weekly session" : "Tournament"} · {event.location}</p>
      <p className="text-sm text-slate-800"><span className="font-semibold">Starts (Sydney time): </span><time dateTime={event.startsAt}>{formatter.format(new Date(event.startsAt))}</time></p>
      <div className="flex flex-wrap items-center gap-3">
        {access.role === "authorised" ? <Link className="inline-flex min-h-11 items-center rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/registrations/${event.id}`}>Registration Management</Link> : null}
        {access.role === "authorised" ? <Link className="inline-flex min-h-11 items-center rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/attendance/${event.id}`}>Mark Attendance</Link> : null}
        {access.role === "authorised" ? <Link className="inline-flex min-h-11 items-center rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/dinner-verification/${event.id}`}>Dinner Verification</Link> : null}
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2" href={`/events/${event.id}/edit`}>Edit Event</Link>
      </div>
    </header>
    {query.saved === "1" ? <p role="status" aria-live="polite" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"><strong>Changes saved.</strong> The event details were saved.</p> : null}
    {canManageEventQr(access) ? event.status === "scheduled"
      ? <Suspense fallback={<p role="status">Loading secure registration settings…</p>}><EventCheckInTokenSection eventId={eventId} eventStartsAt={event.startsAt} /></Suspense>
      : <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">QR registration is available only for Scheduled events. This event is {event.status}.</p>
      : null}
    <Suspense fallback={<ParticipationSummary compact showExplanation={false} title="Participation overview" />}><EventParticipationSection eventId={eventId} /></Suspense>
    {query.preparation === "saved" ? <p role="status">Preparation tasks updated.</p> : query.preparation === "error" ? <p role="alert">Preparation tasks could not be updated. Refresh and try again.</p> : null}
    <Suspense fallback={<p role="status">Loading preparation tasks…</p>}><EventPreparationSection eventId={eventId} /></Suspense>
  </div>;
}
