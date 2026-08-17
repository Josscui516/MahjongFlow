import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMeetingHistoryAccess: vi.fn(),
  queryMeetingHistory: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <button type="button">Sign out</button>,
}));
vi.mock("@/features/meetings/history/server", () => ({
  getMeetingHistoryAccess: mocks.getMeetingHistoryAccess,
  queryMeetingHistory: mocks.queryMeetingHistory,
}));

import MeetingsPage from "./page";

const FICTIONAL_ITEM = {
  id: "00000000-0000-4000-8000-000000000020",
  startsAt: "2026-08-12T10:30:00.000Z",
  summary: "Reviewed a fictional committee workflow.",
  title: "Fictional committee meeting",
} as const;

describe("meetings history page", () => {
  beforeEach(() => {
    mocks.getMeetingHistoryAccess.mockReset();
    mocks.queryMeetingHistory.mockReset();
    mocks.redirect.mockClear();
  });

  it("redirects an anonymous request before querying meeting data", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      ok: false,
      reason: "unauthenticated",
    });

    await expect(MeetingsPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fmeetings",
    );
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?next=%2Fmeetings",
    );
    expect(mocks.queryMeetingHistory).not.toHaveBeenCalled();
  });

  it("renders a fixed permission denial without querying meeting data", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const html = renderToStaticMarkup(await MeetingsPage());

    expect(html).toContain('data-feedback-state="permission"');
    expect(html).toContain("No meeting information has been displayed.");
    expect(html).not.toContain(FICTIONAL_ITEM.title);
    expect(mocks.queryMeetingHistory).not.toHaveBeenCalled();
  });

  it.each(["committee", "authorised"] as const)(
    "renders a trusted %s shell and a freshly queried history list",
    async (role) => {
      mocks.getMeetingHistoryAccess.mockResolvedValue({
        context: {
          role,
          userId: "00000000-0000-4000-8000-000000000021",
        },
        ok: true,
      });
      mocks.queryMeetingHistory.mockResolvedValue({
        items: [FICTIONAL_ITEM],
        ok: true,
      });

      const html = renderToStaticMarkup(await MeetingsPage());

      expect(html).toContain(`Role: ${role === "committee" ? "Committee" : "Authorised"}`);
      expect(html).toContain('aria-current="page"');
      expect(html).toContain(FICTIONAL_ITEM.title);
      expect(html).toContain(
        'href="/meetings/00000000-0000-4000-8000-000000000020"',
      );
      expect(html).not.toContain("00000000-0000-4000-8000-000000000021");
    },
  );

  it("renders the empty state inside the trusted shell", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      context: {
        role: "committee",
        userId: "00000000-0000-4000-8000-000000000022",
      },
      ok: true,
    });
    mocks.queryMeetingHistory.mockResolvedValue({ items: [], ok: true });

    const html = renderToStaticMarkup(await MeetingsPage());

    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain("No meetings recorded");
  });

  it("keeps the trusted shell but hides data when the query fails", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      context: {
        role: "authorised",
        userId: "00000000-0000-4000-8000-000000000023",
      },
      ok: true,
    });
    mocks.queryMeetingHistory.mockResolvedValue({
      error: "MEETING_HISTORY_UNAVAILABLE",
      ok: false,
    });

    const html = renderToStaticMarkup(await MeetingsPage());

    expect(html).toContain("Role: Authorised");
    expect(html).toContain('data-feedback-state="error"');
    expect(html).not.toContain(FICTIONAL_ITEM.title);
  });

  it("fails closed without a shell when access resolution has a system error", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      ok: false,
      reason: "system-error",
    });

    const html = renderToStaticMarkup(await MeetingsPage());

    expect(html).toContain('data-feedback-state="error"');
    expect(html).not.toContain("Role:");
    expect(html).not.toContain(FICTIONAL_ITEM.title);
    expect(mocks.queryMeetingHistory).not.toHaveBeenCalled();
  });
});
