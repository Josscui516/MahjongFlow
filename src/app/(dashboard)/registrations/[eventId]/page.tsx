import { RegistrationWorkspace } from "@/features/registrations/records/RegistrationWorkspace";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getEvent } from "@/features/events/core/service";
import { IdentityRegistrationForm } from "@/features/registrations/records/IdentityRegistrationForm";
import { registrationService } from "@/features/registrations/records/service";
import { changeRegistrationStatus } from "@/features/registrations/records/actions";
import { RegistrationSearch } from "@/features/registrations/records/RegistrationSearch";
import { ParticipationSummary } from "@/features/registrations/attendance-summary/ParticipationSummary";
import { participationSummaryService } from "@/features/registrations/attendance-summary/service";
import { registrationErrors } from "@/features/registrations/records/messages";
import { isRegistrationId } from "@/features/registrations/records/validation";
import { requireBackendUser } from "@/lib/auth/authorization";
import { MemberSubmissionForm } from "@/features/registrations/records/MemberSubmissionForm";

export default async function RegistrationsPage({ params, searchParams }: Readonly<{
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}>) {
  const { eventId } = await params;
  const access=await requireBackendUser();
  if(access.role!=="authorised"){
    const event=await getEvent(eventId);
    if(!event.ok)return <p role="alert">Event unavailable.</p>;
    return <div className="space-y-5"><Link href="/registrations" className="text-emerald-900 underline">Choose another event</Link><h1 className="text-3xl font-bold">{event.record.name}</h1><MemberSubmissionForm list="registration" eventId={eventId} requiresStudentId={event.record.requiresStudentId}/></div>;
  }
  const query = await searchParams;
  const page = query.page === undefined ? 1 : typeof query.page === "string" && /^[1-9]\d*$/.test(query.page) ? Number(query.page) : NaN;
  const list = await registrationService.list(eventId, page);
  if (!list.ok) {
    if (list.code === "UNAUTHENTICATED") {
      const next = isRegistrationId(eventId) ? `/registrations/${eventId}` : "/registrations";
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    return <div className="mx-auto max-w-4xl"><h1 className="mb-4 text-2xl font-bold">Registrations</h1><p role="alert">{registrationErrors[list.code]}</p></div>;
  }
  const summary = await participationSummaryService.get(eventId);
  const event = await getEvent(eventId);
  return <div className="w-full space-y-5">
    <nav aria-label="Registration navigation" className="flex flex-wrap gap-x-5 text-sm font-semibold text-emerald-900">
      <Link className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2" href={`/events/${eventId}`}>Back to event</Link>
      <Link className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2" href="/registrations">Choose another event</Link>
    </nav>
    <header><h1 className="text-3xl font-bold tracking-tight text-slate-950">Event registrations</h1>{event.ok ? <p className="mt-2 text-lg text-slate-700">{event.record.name}</p> : null}</header>
    <ParticipationSummary result={summary} />
    <RegistrationWorkspace initiallyEmpty={list.total === 0} records={<RegistrationSearch key={eventId} eventId={eventId} initialResult={list} changeStatus={changeRegistrationStatus} />} form={event.ok ? <IdentityRegistrationForm eventId={eventId} requiresStudentId={event.record.requiresStudentId} /> : <p role="alert">Event details are unavailable. Refresh before registering.</p>} />
  </div>;
}
