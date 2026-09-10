import { redirect } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/features/events/core/service";
import { IdentityRegistrationForm } from "@/features/registrations/records/IdentityRegistrationForm";
import { registrationService } from "@/features/registrations/records/service";
import { changeRegistrationStatus } from "@/features/registrations/records/actions";
import { RegistrationList } from "@/features/registrations/records/RegistrationList";
import { ParticipationSummary } from "@/features/registrations/attendance-summary/ParticipationSummary";
import { participationSummaryService } from "@/features/registrations/attendance-summary/service";
import { registrationErrors } from "@/features/registrations/records/messages";
import { isRegistrationId } from "@/features/registrations/records/validation";

export default async function RegistrationsPage({ params, searchParams }: Readonly<{
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}>) {
  const { eventId } = await params;
  const query = await searchParams;
  const page = query.page === undefined ? 1 : typeof query.page === "string" && /^[1-9]\d*$/.test(query.page) ? Number(query.page) : NaN;
  const list = await registrationService.list(eventId, page);
  if (!list.ok) {
    if (list.code === "UNAUTHENTICATED") {
      const next = isRegistrationId(eventId) ? `/registrations/${eventId}` : "/registrations";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    return <main className="mx-auto max-w-4xl p-6"><h1 className="mb-4 text-2xl font-bold">Registrations</h1><p role="alert">{registrationErrors[list.code]}</p></main>;
  }
  const summary = await participationSummaryService.get(eventId);
  const event = await getEvent(eventId);
  return <main className="mx-auto w-full max-w-4xl space-y-6 p-6">
    <h1 className="text-2xl font-bold">Event registrations</h1>
    <Link className="underline" href="/registrations">Choose another event</Link>
    {event.ok ? <><h2 className="text-lg font-semibold">{event.record.name}</h2><IdentityRegistrationForm eventId={eventId} requiresStudentId={event.record.requiresStudentId} /></> : <p role="alert">Event details are unavailable. Refresh before registering.</p>}
    <ParticipationSummary result={summary} />
    <RegistrationList result={list} changeStatus={changeRegistrationStatus} />
  </main>;
}
