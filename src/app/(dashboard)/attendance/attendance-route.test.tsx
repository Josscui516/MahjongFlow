import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  audit: vi.fn(),
  registrations: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  summary: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect, useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/registrations/records/service", () => ({ registrationService: { list: mocks.registrations } }));
vi.mock("@/features/attendance/manual/actions", () => ({ submitManualAttendance: vi.fn() }));
vi.mock("@/features/attendance/records/server", () => ({
  attendanceAuditService: { listForEvent: mocks.audit },
}));
vi.mock("@/features/attendance/manual", () => ({
  ManualAttendanceLoading: () => <p>Loading manual attendance…</p>,
  ManualAttendancePanel: ({ eventId }: { eventId: string }) => (
    <section aria-label="Manual attendance">{eventId}</section>
  ),
}));
vi.mock("@/features/registrations/attendance-summary/server", () => ({
  participationSummaryService: { get: mocks.summary },
}));

import Page from "./[eventId]/page";
import ErrorBoundary from "./[eventId]/error";
import Loading from "./[eventId]/loading";

const eventId = "34000000-0000-4000-8000-000000000034";
const params = Promise.resolve({ eventId });

describe("attendance route access boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.registrations.mockResolvedValue({ ok: true, eventId, items: [{ id: "reg-1", participantName: "Fictional Attendee", participantEmail: "fictional.attendee@example.test", status: "registered" }], page: 1, total: 1 });
  });

  it("redirects anonymous sessions without reading aggregate or personal data", async () => {
    mocks.audit.mockResolvedValue({ code: "UNAUTHENTICATED", ok: false });

    await expect(Page({ params })).rejects.toThrow(
      `redirect:/login?next=%2Fattendance%2F${eventId}`,
    );
    expect(mocks.registrations).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it("returns a safe denial to committee users without reading aggregates", async () => {
    mocks.audit.mockResolvedValue({ code: "PERMISSION_DENIED", ok: false });

    const html = renderToStaticMarkup(await Page({ params }));

    expect(html).toContain("do not have permission");
    expect(html).not.toContain("@example.test");
    expect(mocks.registrations).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
  });

  it("renders independently sourced totals and authorised attendance details", async () => {
    mocks.audit.mockResolvedValue({
      event: { id: eventId, name: "Fictional Attendance Event" },
      items: [
        {
          checkedInAt: "2026-09-28T01:00:00.000Z",
          eventId,
          id: "34000000-0000-4000-8000-000000000035",
          method: "qr",
          participantEmail: "fictional.attendee@example.test",
          participantId: "34000000-0000-4000-8000-000000000036",
          participantName: "Fictional Attendee",
          recordedBy: null,
          status: "confirmed",
          updatedAt: "2026-09-28T01:00:00.000Z",
        },
      ],
      ok: true,
    });
    mocks.summary.mockResolvedValue({
      confirmedAttendanceCount: 1,
      ok: true,
      registrationCount: 2,
    });

    const html = renderToStaticMarkup(await Page({ params }));

    expect(html).toContain("Fictional Attendance Event");
    expect(html).toContain("Fictional Attendee");
    expect(html).toContain("fictional.attendee@example.test");
    expect(html).not.toContain("Currently registered");
    expect(html).toContain('data-testid="attendance-count" aria-live="polite" aria-atomic="true">1');
    expect(html).not.toContain("Manage registrations");
    expect(html).not.toContain("Verify dinner eligibility");
    expect(html).not.toContain("Participant-level attendance");
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked=""');
    expect(mocks.summary).toHaveBeenCalledWith(eventId);
  });

  it.each(["VALIDATION", "UNAVAILABLE", "SYSTEM_ERROR"] as const)(
    "renders %s without exposing details or querying totals",
    async (code) => {
      mocks.audit.mockResolvedValue({ code, ok: false });

      const html = renderToStaticMarkup(await Page({ params }));

      expect(html).toContain('role="alert"');
      expect(html).not.toContain("@example.test");
      expect(mocks.registrations).not.toHaveBeenCalled();
    expect(mocks.summary).not.toHaveBeenCalled();
    },
  );

  it("provides route-level loading and recoverable system-error states", () => {
    const loading = renderToStaticMarkup(<Loading />);
    const error = renderToStaticMarkup(<ErrorBoundary reset={vi.fn()} />);

    expect(loading).toContain("Loading attendance checklist");
    expect(error).toContain('role="alert"');
    expect(error).toContain("Attendance records could not be loaded");
    expect(error).toContain("Try again");
  });
});
