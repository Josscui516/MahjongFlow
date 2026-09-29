import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AttendanceAuditResult } from "@/features/attendance/records";

const { listForEvent, submit } = vi.hoisted(() => ({ listForEvent: vi.fn(), submit: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/attendance/records/server", () => ({ attendanceAuditService: { listForEvent } }));
vi.mock("./actions", () => ({ submitManualAttendance: submit }));
vi.mock("./ManualAttendanceForm", () => ({ ConnectedManualAttendanceForm: () => <div>Authorised manual form</div> }));

import { ManualAttendanceLoading, ManualAttendancePanel } from "./ManualAttendancePanel";

describe("ManualAttendancePanel authorised server boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["PERMISSION_DENIED", "do not have permission"],
    ["UNAUTHENTICATED", "Sign in"],
    ["UNAVAILABLE", "no longer available"],
    ["VALIDATION", "selected event is invalid"],
    ["SYSTEM_ERROR", "could not be loaded"],
  ] as const)("does not render the client form for %s", async (code, message) => {
    listForEvent.mockResolvedValue({ ok: false, code } satisfies AttendanceAuditResult);
    const html = renderToStaticMarkup(await ManualAttendancePanel({ eventId: "fictional-event" }));
    expect(listForEvent).toHaveBeenCalledExactlyOnceWith("fictional-event");
    expect(html).toContain('role="alert"');
    expect(html).toContain(message);
    expect(html).not.toContain("Authorised manual form");
    expect(html).not.toContain("@example.test");
    expect(submit).not.toHaveBeenCalled();
  });

  it("binds the authenticated event and only passes the audit DTO", async () => {
    const event = { id: "33000000-0000-4000-8000-000000000001", name: "Fictional manual event" };
    listForEvent.mockResolvedValue({ ok: true, event, items: [] } satisfies AttendanceAuditResult);
    const element = await ManualAttendancePanel({ eventId: event.id });
    expect(element.props.event).toEqual(event);
    expect(element.props.records).toEqual([]);
    const data = new FormData();
    await element.props.action({ status: "idle" }, data);
    expect(submit).toHaveBeenCalledExactlyOnceWith(event.id, { status: "idle" }, data);
  });

  it("provides an accessible loading state for the route owner", () => {
    expect(renderToStaticMarkup(<ManualAttendanceLoading />)).toContain('role="status"');
  });
});
