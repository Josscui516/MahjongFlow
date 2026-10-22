import Link from "next/link";
import { redirect } from "next/navigation";

import { AttendanceAuditList } from "@/features/attendance/records";
import { attendanceAuditService } from "@/features/attendance/records/server";
import { AttendanceChecklist } from "@/features/attendance/checklist/AttendanceChecklist";
import { buildAttendanceChecklist } from "@/features/attendance/checklist/projection";
import { submitManualAttendance } from "@/features/attendance/manual/actions";
import { participationSummaryService } from "@/features/registrations/attendance-summary/server";
import { registrationService } from "@/features/registrations/records/service";
import { listAllRegistrations } from "@/features/registrations/records/list-all";

export default async function AttendancePage({ params }: Readonly<{ params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const audit = await attendanceAuditService.listForEvent(eventId);
  if (!audit.ok) {
    if (audit.code === "UNAUTHENTICATED") redirect(`/login?next=${encodeURIComponent(`/attendance/${eventId}`)}`);
    return <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Event attendance</h1>
      <AttendanceAuditList result={audit} />
    </div>;
  }
  const [registrations, summary] = await Promise.all([
    listAllRegistrations(eventId, registrationService.list),
    participationSummaryService.get(eventId),
  ]);
  return <div className="mx-auto w-full max-w-5xl space-y-5">
    <nav aria-label="Attendance navigation" className="flex flex-wrap gap-x-5 text-sm font-semibold text-emerald-900">
      <Link className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2" href={`/events/${eventId}`}>Back to event</Link>
    </nav>
    <header className="space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">Event attendance</h1>
      <p className="text-lg text-slate-700">{audit.event.name}</p>
    </header>
    {registrations.ok ? <AttendanceChecklist
      rows={buildAttendanceChecklist(registrations.items, audit.items)}
      confirmedCount={summary.ok ? summary.confirmedAttendanceCount : null}
      action={submitManualAttendance.bind(null, eventId)}
    /> : <p role="alert" className="rounded-xl border border-slate-200 bg-white p-5">Registered participants could not be loaded. Refresh to try again.</p>}
  </div>;
}
