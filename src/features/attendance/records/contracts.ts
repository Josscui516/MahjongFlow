export type AttendanceMethod = "manual" | "qr";

export type AttendanceStatus = "confirmed" | "voided";

export type AttendanceRecorder = Readonly<{
  displayName: string;
}>;

type AttendanceAuditRecordBase = Readonly<{
  checkedInAt: string;
  eventId: string;
  id: string;
  participantEmail: string;
  participantId: string;
  participantName: string;
  updatedAt: string;
}>;

/**
 * A missing recorder is valid only for an unchanged self-service QR record.
 * Manual records and voided records always carry the trusted authorised actor.
 */
export type AttendanceAuditRecord =
  | Readonly<
      AttendanceAuditRecordBase & {
        method: "qr";
        recordedBy: null;
        status: "confirmed";
      }
    >
  | Readonly<
      AttendanceAuditRecordBase & {
        method: AttendanceMethod;
        recordedBy: AttendanceRecorder;
        status: AttendanceStatus;
      }
    >;

export type AttendanceAuditEvent = Readonly<{
  id: string;
  name: string;
}>;

export type AttendanceAuditFailureCode =
  | "PERMISSION_DENIED"
  | "SYSTEM_ERROR"
  | "UNAUTHENTICATED"
  | "UNAVAILABLE"
  | "VALIDATION";

export type AttendanceAuditResult =
  | Readonly<{
      code: AttendanceAuditFailureCode;
      ok: false;
    }>
  | Readonly<{
      event: AttendanceAuditEvent;
      items: readonly AttendanceAuditRecord[];
      ok: true;
    }>;

/** Authorised-only port. It must never be exposed to participant/public UI. */
export type AttendanceReadPort = Readonly<{
  listForEvent: (eventId: string) => Promise<AttendanceAuditResult>;
}>;
