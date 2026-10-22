import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AttendanceChecklist } from "./AttendanceChecklist";
import { attendanceChange, buildAttendanceChecklist, checklistPage } from "./projection";
import { FICTIONAL_QR_ATTENDANCE as record } from "../records/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const registered = { id: "reg-1", participantName: "Fictional Attendee", participantEmail: record.participantEmail, status: "registered" as const };

describe("registered attendance checklist", () => {
  it("excludes cancelled registrations and matches existing attendance by normalised email", () => {
    const rows = buildAttendanceChecklist([{ ...registered, participantEmail: record.participantEmail.toUpperCase() }, { ...registered, id: "cancelled", status: "cancelled" }], [record]);
    expect(rows).toHaveLength(1);
    expect(rows[0].attendance).toEqual({ id: record.id, status: "confirmed", updatedAt: record.updatedAt });
    expect(rows[0]).not.toHaveProperty("participantId");
  });
  it("creates a new attendance and supplies the explicit checkbox confirmation", () => {
    const [row] = buildAttendanceChecklist([registered], []);
    expect(Object.fromEntries(attendanceChange(row, true))).toEqual({ operation: "create", email: registered.participantEmail, confirmation: "confirmed" });
  });
  it("voids and restores through the existing version checked correction contract", () => {
    const [row] = buildAttendanceChecklist([registered], [record]);
    const data = Object.fromEntries(attendanceChange(row, false));
    expect(data).toEqual({ operation: "correct", recordId: record.id, expectedUpdatedAt: record.updatedAt, targetStatus: "voided", confirmation: "confirmed" });
    expect(attendanceChange({ ...row, attendance: { ...row.attendance!, status: "voided" } }, true).get("targetStatus")).toBe("confirmed");
  });
  it("shows saved checked states and total without a registration total", () => {
    const html = renderToStaticMarkup(<AttendanceChecklist rows={buildAttendanceChecklist([registered], [record])} confirmedCount={1} action={async () => ({ status: "idle" })} />);
    expect(html).toContain('checked=""');
    expect(html).toContain("Mark attendance for Fictional Attendee");
    expect(html).not.toContain("Currently registered");
  });
  it("shows an explicit empty roster and does not fabricate a failed count", () => {
    const html = renderToStaticMarkup(<AttendanceChecklist rows={[]} confirmedCount={null} action={async () => ({ status: "idle" })} />);
    expect(html).toContain("No registered participants");
    expect(html).toContain("Attendance total unavailable");
    expect(html).not.toContain('type="checkbox"');
  });
});

describe("checklist search and pages", () => {
  const rows = Array.from({ length: 23 }, (_, index) => ({ id: String(index), name: `Test ${index}`, email: `test${index}@example.test`, attendance: index === 0 ? { id: "attendance", status: "confirmed" as const, updatedAt: record.updatedAt } : null }));
  it("shows ten per page and includes the final partial page", () => {
    expect(checklistPage(rows, "", "all", 1).items).toHaveLength(10);
    const last = checklistPage(rows, "", "all", 3);
    expect(last.items).toHaveLength(3);
    expect([last.start, last.end, last.total]).toEqual([21, 23, 23]);
  });
  it("searches names and emails without case sensitivity", () => {
    expect(checklistPage(rows, " TEST22@EXAMPLE.TEST ", "all", 1).items.map(row => row.id)).toEqual(["22"]);
    expect(checklistPage(rows, "Test 22", "all", 1).total).toBe(1);
  });
  it("filters confirmed and unmarked rows and clamps a stale page", () => {
    expect(checklistPage(rows, "", "confirmed", 3).page).toBe(1);
    expect(checklistPage(rows, "", "confirmed", 1).total).toBe(1);
    expect(checklistPage(rows, "", "unmarked", 1).total).toBe(22);
    expect(checklistPage(rows, "missing", "all", 1).total).toBe(0);
  });
});
