import type { AttendanceAuditResult } from "@/features/attendance/records";
import { AttendanceAuditList } from "@/features/attendance/records";
import {
  ParticipationSummary,
  type ParticipationSummaryResult,
} from "@/features/registrations/attendance-summary";

export function AttendanceWorkspace({
  audit,
  summary,
}: Readonly<{
  audit: AttendanceAuditResult;
  summary: ParticipationSummaryResult;
}>) {
  return (
    <div className="space-y-5">
      <ParticipationSummary result={summary} />
      <AttendanceAuditList result={audit} />
    </div>
  );
}
