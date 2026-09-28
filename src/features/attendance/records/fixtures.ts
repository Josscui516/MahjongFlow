import type {
  AttendanceAuditEvent,
  AttendanceAuditRecord,
} from "./contracts";

export const FICTIONAL_ATTENDANCE_EVENT = {
  id: "32000000-0000-4000-8000-000000000001",
  name: "Fictional Spring Social",
} satisfies AttendanceAuditEvent;

export const FICTIONAL_QR_ATTENDANCE = {
  checkedInAt: "2026-09-16T08:05:00.000Z",
  eventId: FICTIONAL_ATTENDANCE_EVENT.id,
  id: "32000000-0000-4000-8000-000000000011",
  method: "qr",
  participantEmail: "river.quinn@example.test",
  participantId: "32000000-0000-4000-8000-000000000021",
  participantName: "River Quinn",
  recordedBy: null,
  status: "confirmed",
  updatedAt: "2026-09-16T08:05:00.000Z",
} satisfies AttendanceAuditRecord;

export const FICTIONAL_MANUAL_ATTENDANCE = {
  checkedInAt: "2026-09-16T08:08:00.000Z",
  eventId: FICTIONAL_ATTENDANCE_EVENT.id,
  id: "32000000-0000-4000-8000-000000000012",
  method: "manual",
  participantEmail: "taylor.moon@example.test",
  participantId: "32000000-0000-4000-8000-000000000022",
  participantName: "Taylor Moon",
  recordedBy: { displayName: "Fictional Authorised Recorder" },
  status: "voided",
  updatedAt: "2026-09-16T08:12:00.000Z",
} satisfies AttendanceAuditRecord;

export const FICTIONAL_CORRECTED_QR_ATTENDANCE = {
  checkedInAt: "2026-09-16T08:14:00.000Z",
  eventId: FICTIONAL_ATTENDANCE_EVENT.id,
  id: "32000000-0000-4000-8000-000000000013",
  method: "qr",
  participantEmail: "casey.star@example.test",
  participantId: "32000000-0000-4000-8000-000000000023",
  participantName: "Casey Star",
  recordedBy: { displayName: "Fictional QR Corrector" },
  status: "voided",
  updatedAt: "2026-09-16T08:18:00.000Z",
} satisfies AttendanceAuditRecord;
