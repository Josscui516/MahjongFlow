import { AttendanceAuditLoading } from "@/features/attendance/records";
import { ManualAttendanceLoading } from "@/features/attendance/manual";
import { ParticipationSummary } from "@/features/registrations/attendance-summary";

export default function LoadingAttendance() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6">
      <p className="text-3xl font-bold text-slate-950">Event attendance</p>
      <ParticipationSummary />
      <AttendanceAuditLoading />
      <ManualAttendanceLoading />
    </div>
  );
}
