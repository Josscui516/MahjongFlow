import type { AttendanceAuditRecord } from "../records";
import type { AttendanceChecklistRow } from "./contracts";

type Registration = Readonly<{ id: string; participantName: string; participantEmail: string; status: "registered" | "cancelled" }>;

export function buildAttendanceChecklist(registrations: readonly Registration[], records: readonly AttendanceAuditRecord[]): AttendanceChecklistRow[] {
  const attendance = new Map(records.map(record => [record.participantEmail.trim().toLowerCase(), record]));
  return registrations.filter(item => item.status === "registered").map(item => {
    const record = attendance.get(item.participantEmail.trim().toLowerCase());
    return {
      id: item.id, name: item.participantName, email: item.participantEmail,
      attendance: record ? { id: record.id, status: record.status, updatedAt: record.updatedAt } : null,
    };
  });
}

export function attendanceChange(row: AttendanceChecklistRow, checked: boolean): FormData {
  const data = new FormData();
  data.set("confirmation", "confirmed");
  if (row.attendance) {
    data.set("operation", "correct");
    data.set("recordId", row.attendance.id);
    data.set("expectedUpdatedAt", row.attendance.updatedAt);
    data.set("targetStatus", checked ? "confirmed" : "voided");
  } else {
    data.set("operation", "create");
    data.set("email", row.email);
  }
  return data;
}

export function checklistPage(rows: readonly AttendanceChecklistRow[], search: string, filter: "all" | "unmarked" | "confirmed", requestedPage: number) {
  const query = search.trim().toLowerCase();
  const matches = rows.filter(row => (!query || row.name.toLowerCase().includes(query) || row.email.toLowerCase().includes(query))
    && (filter === "all" || (row.attendance?.status === "confirmed") === (filter === "confirmed")));
  const pages = Math.max(1, Math.ceil(matches.length / 10));
  const page = Math.max(1, Math.min(requestedPage, pages));
  const offset = (page - 1) * 10;
  return { items: matches.slice(offset, offset + 10), total: matches.length, pages, page, start: matches.length ? offset + 1 : 0, end: Math.min(offset + 10, matches.length) };
}
