import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SuccessFeedback, SystemErrorFeedback } from "@/components/feedback";
import { requireBackendUser } from "@/lib/auth/authorization";
import { getEvent } from "@/features/events/core/service";
import { EventStatusBadge } from "@/features/events/presentation";
import { EventPreparationSection } from "@/features/events/preparation/EventPreparationSection";
import { EventParticipationSection } from "@/features/registrations/attendance-summary/EventParticipationSection";
import { ParticipationSummary } from "@/features/registrations/attendance-summary/ParticipationSummary";

const formatter = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "short", timeZone: "Australia/Sydney" });
export default async function EventPage({ params, searchParams }: Readonly<{ params: Promise<{ eventId: string }>; searchParams: Promise<{ saved?: string; preparation?: string; candidatePage?: string }> }>) {
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
        {access.role === "authorised" ? <Link className="inline-flex min-h-11 items-center rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2" href={`/registrations/${event.id}`}>Manage registrations</Link> : null}
        <Link className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2" href={`/events/${event.id}/edit`}>Edit event</Link>
        <a className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline focus-visible:outline-2 focus-visible:outline-offset-2" href="#preparation-heading">Preparation tasks</a>
      </div>
    </header>
    {query.saved === "1" ? <SuccessFeedback message="The event details were saved." /> : null}
    <Suspense fallback={<ParticipationSummary />}><EventParticipationSection eventId={eventId} /></Suspense>
    {query.preparation === "saved" ? <p role="status">Preparation tasks updated.</p> : query.preparation === "error" ? <p role="alert">Preparation tasks could not be updated. Refresh and try again.</p> : null}
    <Suspense fallback={<p role="status">Loading preparation tasks…</p>}><EventPreparationSection eventId={eventId} candidatePage={Number(query.candidatePage ?? 1)} /></Suspense>
    <details className="rounded-xl border border-slate-200 bg-white p-5">
      <summary className="min-h-11 cursor-pointer py-2 font-semibold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2">Event details and registration requirements</summary>
      <dl className="mt-3 space-y-4 text-sm"><div><dt className="font-semibold text-slate-900">Description</dt><dd className="mt-1 whitespace-pre-wrap text-slate-700">{event.description || "No description provided."}</dd></div><div><dt className="font-semibold text-slate-900">Student ID</dt><dd className="mt-1 text-slate-700">{event.requiresStudentId ? "Required for registration" : "Not required"}</dd></div></dl>
    </details>
  </div>;
}
