import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ManualAttendanceLoading,
  ManualAttendancePanel,
} from "@/features/attendance/manual";
import { AttendanceAuditList } from "@/features/attendance/records";
import { attendanceAuditService } from "@/features/attendance/records/server";
import { AttendanceWorkspace } from "@/features/attendance/views";
import { participationSummaryService } from "@/features/registrations/attendance-summary/server";

export default async function AttendancePage({
  params,
}: Readonly<{ params: Promise<{ eventId: string }> }>) {
  const { eventId } = await params;
  const audit = await attendanceAuditService.listForEvent(eventId);

  if (!audit.ok) {
    if (audit.code === "UNAUTHENTICATED") {
      redirect(`/login?next=${encodeURIComponent(`/attendance/${eventId}`)}`);
    }

    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Event attendance
        </h1>
        <AttendanceAuditList result={audit} />
      </div>
    );
  }

  const summary = await participationSummaryService.get(eventId);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <nav
        aria-label="Attendance navigation"
        className="flex flex-wrap gap-x-5 text-sm font-semibold text-emerald-900"
      >
        <Link
          className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={`/events/${eventId}`}
        >
          Back to event
        </Link>
        <Link
          className="inline-flex min-h-11 items-center underline focus-visible:outline-2 focus-visible:outline-offset-2"
          href={`/registrations/${eventId}`}
        >
          Manage registrations
        </Link>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Event attendance
        </h1>
        <p className="text-lg text-slate-700">{audit.event.name}</p>
        <p className="text-sm text-slate-600">
          Participant-level attendance is restricted to authorised staff.
        </p>
      </header>
      <AttendanceWorkspace audit={audit} summary={summary} />
      <Suspense fallback={<ManualAttendanceLoading />}>
        <ManualAttendancePanel eventId={eventId} />
      </Suspense>
    </div>
  );
}
