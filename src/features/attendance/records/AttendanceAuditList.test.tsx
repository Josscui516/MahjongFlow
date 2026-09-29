import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  AttendanceAuditList,
  AttendanceAuditLoading,
} from "./AttendanceAuditList";
import type { AttendanceAuditFailureCode } from "./contracts";
import {
  FICTIONAL_ATTENDANCE_EVENT,
  FICTIONAL_CORRECTED_QR_ATTENDANCE,
  FICTIONAL_MANUAL_ATTENDANCE,
  FICTIONAL_QR_ATTENDANCE,
} from "./fixtures";

describe("AttendanceAuditList", () => {
  it("shows every K-05 field for QR and manual attendance", () => {
    const html = renderToStaticMarkup(
      <AttendanceAuditList
        result={{
          event: FICTIONAL_ATTENDANCE_EVENT,
          items: [FICTIONAL_QR_ATTENDANCE, FICTIONAL_MANUAL_ATTENDANCE],
          ok: true,
        }}
      />,
    );

    expect(html).toContain("Fictional Spring Social");
    expect(html).toContain("River Quinn");
    expect(html).toContain("river.quinn@example.test");
    expect(html).toContain("Taylor Moon");
    expect(html).toContain("taylor.moon@example.test");
    expect(html).toContain("Confirmed");
    expect(html).toContain("Voided");
    expect(html).toContain(">QR<");
    expect(html).toContain(">Manual<");
    expect(html).toContain("Self-service QR");
    expect(html).toContain("Fictional Authorised Recorder");
    expect(html).toContain(
      `dateTime="${FICTIONAL_QR_ATTENDANCE.checkedInAt}"`,
    );
    expect(html).toContain(
      `dateTime="${FICTIONAL_MANUAL_ATTENDANCE.updatedAt}"`,
    );
    expect(html).toContain("16 Sept 2026");

    expect(html).not.toContain(FICTIONAL_QR_ATTENDANCE.id);
    expect(html).not.toContain(FICTIONAL_QR_ATTENDANCE.participantId);
    expect(html).not.toContain(FICTIONAL_ATTENDANCE_EVENT.id);
  });

  it("attributes a corrected QR record instead of labelling it self-service", () => {
    const html = renderToStaticMarkup(
      <AttendanceAuditList
        result={{
          event: FICTIONAL_ATTENDANCE_EVENT,
          items: [FICTIONAL_CORRECTED_QR_ATTENDANCE],
          ok: true,
        }}
      />,
    );

    expect(html).toContain(">QR<");
    expect(html).toContain("Voided");
    expect(html).toContain("Fictional QR Corrector");
    expect(html).not.toContain("Self-service QR");
  });

  it("renders an existing event with no rows as an explicit empty state", () => {
    const html = renderToStaticMarkup(
      <AttendanceAuditList
        result={{ event: FICTIONAL_ATTENDANCE_EVENT, items: [], ok: true }}
      />,
    );

    expect(html).toContain("0 records");
    expect(html).toContain(
      "No attendance records have been recorded for this event.",
    );
    expect(html).not.toContain('role="alert"');
  });

  it.each([
    ["UNAUTHENTICATED", "Sign in"],
    ["PERMISSION_DENIED", "do not have permission"],
    ["VALIDATION", "selected event is invalid"],
    ["UNAVAILABLE", "event is no longer available"],
    ["SYSTEM_ERROR", "could not be loaded"],
  ] satisfies readonly (readonly [AttendanceAuditFailureCode, string])[])(
    "renders a safe %s state without attendance details",
    (code, message) => {
      const html = renderToStaticMarkup(
        <AttendanceAuditList result={{ code, ok: false }} />,
      );

      expect(html).toContain('role="alert"');
      expect(html).toContain(message);
      expect(html).not.toContain("@example.test");
      expect(html).not.toContain("sensitive database detail");
    },
  );

  it("exports an accessible loading state for the route owner", () => {
    const html = renderToStaticMarkup(<AttendanceAuditLoading />);

    expect(html).toContain('role="status"');
    expect(html).toContain("Loading attendance audit records");
  });
});
