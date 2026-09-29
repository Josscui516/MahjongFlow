import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FICTIONAL_ATTENDANCE_EVENT,
  FICTIONAL_QR_ATTENDANCE,
} from "@/features/attendance/records/fixtures";

import { AttendanceWorkspace } from "./AttendanceWorkspace";

describe("AttendanceWorkspace", () => {
  it("keeps safe totals separate from authorised participant details", () => {
    const html = renderToStaticMarkup(
      <AttendanceWorkspace
        audit={{
          event: FICTIONAL_ATTENDANCE_EVENT,
          items: [FICTIONAL_QR_ATTENDANCE],
          ok: true,
        }}
        summary={{
          confirmedAttendanceCount: 1,
          ok: true,
          registrationCount: 3,
        }}
      />,
    );

    expect(html).toContain('data-testid="registered-count">3');
    expect(html).toContain('data-testid="attendance-count">1');
    expect(html).toContain(FICTIONAL_QR_ATTENDANCE.participantName);
    expect(html).toContain(FICTIONAL_QR_ATTENDANCE.participantEmail);
  });

  it("does not fabricate totals when their independent query fails", () => {
    const html = renderToStaticMarkup(
      <AttendanceWorkspace
        audit={{
          event: FICTIONAL_ATTENDANCE_EVENT,
          items: [],
          ok: true,
        }}
        summary={{ code: "SYSTEM_ERROR", ok: false }}
      />,
    );

    expect(html).toContain("Participation totals unavailable");
    expect(html).toContain("No attendance records have been recorded");
    expect(html).not.toContain('data-testid="attendance-count"');
  });
});
