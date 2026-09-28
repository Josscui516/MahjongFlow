import "server-only";

import { attendanceAuditService } from "@/features/attendance/records/server";
import { submitManualAttendance } from "./actions";
import { ConnectedManualAttendanceForm } from "./ManualAttendanceForm";

const failureMessages = {
  PERMISSION_DENIED: "You do not have permission to change attendance records.",
  UNAUTHENTICATED: "Sign in to manage attendance records.",
  UNAVAILABLE: "This event is no longer available.",
  VALIDATION: "The selected event is invalid.",
  SYSTEM_ERROR: "Manual attendance could not be loaded. Please try again.",
} as const;

export function ManualAttendanceLoading() {
  return <p role="status">Loading manual attendance…</p>;
}

/** Independent authorised-only composition point for the route owner. */
export async function ManualAttendancePanel({ eventId }: Readonly<{ eventId: string }>) {
  const result = await attendanceAuditService.listForEvent(eventId);
  if (!result.ok) return <p role="alert">{failureMessages[result.code]}</p>;
  return <ConnectedManualAttendanceForm
    key={result.event.id}
    action={submitManualAttendance.bind(null, result.event.id)}
    event={result.event}
    records={result.items}
  />;
}
