import type { ManualAttendanceCommand, ManualAttendanceField, ManualAttendanceFieldError } from "./contracts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/u;
// Retain the database's microseconds verbatim: Date.toISOString loses CAS precision.
const VERSION = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function isVersion(value: string): boolean {
  if (!VERSION.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= monthDays[month - 1]
    && Number(value.slice(11, 13)) < 24;
}

export function validateManualAttendance(eventId: unknown, formData: FormData):
  | Readonly<{ ok: true; command: ManualAttendanceCommand }>
  | Readonly<{ ok: false; errors: readonly ManualAttendanceFieldError[] }> {
  const errors: ManualAttendanceFieldError[] = [];
  function field(name: ManualAttendanceField): string {
    const values = formData.getAll(name);
    if (values.length !== 1 || typeof values[0] !== "string") return "";
    return values[0];
  }
  function error(name: ManualAttendanceField, message: string) {
    errors.push({ field: name, message });
  }
  if (typeof eventId !== "string" || !UUID.test(eventId)) error("eventId", "Choose a valid event.");
  if (field("confirmation") !== "confirmed") error("confirmation", "Confirm this attendance change before saving.");
  const operation = field("operation");
  let command: ManualAttendanceCommand | undefined;
  const normalisedEventId = typeof eventId === "string" ? eventId.toLowerCase() : "";
  if (operation === "create") {
    const email = field("email").trim().toLowerCase();
    if (!EMAIL.test(email) || Array.from(email).length > 254) error("email", "Enter one valid email for an existing participant.");
    command = { operation, eventId: normalisedEventId, email };
  } else if (operation === "correct") {
    const recordId = field("recordId");
    const expectedUpdatedAt = field("expectedUpdatedAt");
    const targetStatus = field("targetStatus");
    if (!UUID.test(recordId)) error("recordId", "Choose an attendance record.");
    if (!isVersion(expectedUpdatedAt)) {
      error("expectedUpdatedAt", "Refresh the attendance list before correcting this record.");
    }
    if (targetStatus !== "confirmed" && targetStatus !== "voided") error("targetStatus", "Choose confirmed or voided.");
    else command = { operation, eventId: normalisedEventId, recordId: recordId.toLowerCase(), expectedUpdatedAt, targetStatus };
  } else error("operation", "Choose a manual attendance operation.");
  if (errors.length || !command) return { ok: false, errors };
  return { ok: true, command };
}
