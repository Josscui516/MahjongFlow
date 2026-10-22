import type { ReactNode } from "react";

import type { AttendanceAuditResult } from "@/features/attendance/records";
import { AttendanceAuditList } from "@/features/attendance/records";
import {
  ParticipationSummary,
  type ParticipationSummaryResult,
} from "@/features/registrations/attendance-summary";

export function AttendanceWorkspace({
  audit,
  summary,
  children,
}: Readonly<{
  children?: ReactNode;
  audit: AttendanceAuditResult;
  summary: ParticipationSummaryResult;
}>) {
  return (
    <div className="space-y-5">
      <ParticipationSummary result={summary} />
      {children}
      <AttendanceAuditList result={audit} />
    </div>
  );
}
