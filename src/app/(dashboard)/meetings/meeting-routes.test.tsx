import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    useRouter: () => ({ push: vi.fn() }),
  };
});

const authMocks = vi.hoisted(() => ({
  requireBackendUser: vi.fn(),
}));

const meetingMocks = vi.hoisted(() => ({
  listMeetingAttendeeOptions: vi.fn(),
  readMeeting: vi.fn(),
  readMeetingAgenda: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/authorization")>();
  return { ...actual, requireBackendUser: authMocks.requireBackendUser };
});

vi.mock("@/features/meetings/editor/server", () => meetingMocks);

vi.mock("@/features/meetings/editor/actions", () => ({
  createMeetingAction: vi.fn(),
  getMeetingAction: vi.fn(),
  saveMeetingAgendaAction: vi.fn(),
  updateMeetingAction: vi.fn(),
}));

vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <form><button type="submit">Sign out</button></form>,
}));

import MeetingDetailPage from "@/app/(dashboard)/meetings/[meetingId]/page";
import NewMeetingPage from "@/app/(dashboard)/meetings/new/page";
import { AuthorizationError } from "@/lib/auth/authorization";

describe("meeting editor routes", () => {
  beforeEach(() => {
    authMocks.requireBackendUser.mockReset();
    meetingMocks.listMeetingAttendeeOptions.mockResolvedValue({
      ok: true,
      options: [{ id: "11111111-1111-4111-8111-111111111111", label: "Alex Example" }],
    });
    meetingMocks.readMeeting.mockResolvedValue({
      ok: true,
      record: {
        attendeeIds: ["11111111-1111-4111-8111-111111111111"],
        createdAt: "2026-08-18T08:30:00.000Z",
        createdBy: "11111111-1111-4111-8111-111111111111",
        id: "22222222-2222-4222-8222-222222222222",
        startsAt: "2026-08-18T08:30:00.000Z",
        summary: "Safe fictional summary.",
        title: "Weekly committee meeting",
        updatedAt: "2026-08-18T08:30:00.000Z",
      },
    });
    meetingMocks.readMeetingAgenda.mockResolvedValue({
      meetingId: "22222222-2222-4222-8222-222222222222",
      discussionPoints: [],
      decisions: [],
    });
  });

  it("allows a committee user to open the create route", async () => {
    authMocks.requireBackendUser.mockResolvedValue({
      role: "committee",
      userId: "fictional-user",
    });

    const html = renderToStaticMarkup(await NewMeetingPage());

    expect(html).toContain("Create meeting");
    expect(html).toContain('id="meeting-title"');
    expect(html).toContain('aria-current="page"');
  });

  it("renders the persisted meeting and agenda without task controls", async () => {
    authMocks.requireBackendUser.mockResolvedValue({
      role: "authorised",
      userId: "fictional-user",
    });

    const html = renderToStaticMarkup(
      await MeetingDetailPage({
        params: Promise.resolve({ meetingId: "22222222-2222-4222-8222-222222222222" }),
      }),
    );

    expect(html).toContain("Weekly committee meeting");
    expect(html).toContain("Meeting agenda");
    expect(html).not.toContain("Create task");
  });

  it("redirects an anonymous direct request before rendering the editor", async () => {
    authMocks.requireBackendUser.mockRejectedValue(
      new AuthorizationError("UNAUTHENTICATED"),
    );

    await expect(NewMeetingPage()).rejects.toMatchObject({
      digest: expect.stringContaining("NEXT_REDIRECT"),
    });
  });

  it("uses the route not-found boundary for a missing meeting", async () => {
    authMocks.requireBackendUser.mockResolvedValue({ role: "committee", userId: "fictional-user" });
    meetingMocks.readMeeting.mockResolvedValue({ ok: false, code: "NOT_FOUND" });

    await expect(MeetingDetailPage({
      params: Promise.resolve({ meetingId: "40000000-0000-4000-8000-000000000004" }),
    })).rejects.toMatchObject({ digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  });

  it("returns fixed denial copy without meeting content for a forbidden role", async () => {
    authMocks.requireBackendUser.mockRejectedValue(
      new AuthorizationError("FORBIDDEN"),
    );

    const html = renderToStaticMarkup(
      await MeetingDetailPage({
        params: Promise.resolve({ meetingId: "22222222-2222-4222-8222-222222222222" }),
      }),
    );

    expect(html).toContain("Access required");
    expect(html).not.toContain("Weekly committee meeting");
    expect(html).not.toContain("Alex Example");
  });
});
