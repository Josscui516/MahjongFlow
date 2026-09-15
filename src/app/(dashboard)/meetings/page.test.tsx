import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getMeetingHistoryAccess: vi.fn(),
  queryMeetingHistory: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/features/meetings/editor/actions", () => ({
  deleteMeetingAction: vi.fn(),
}));
vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <button type="button">Sign out</button>,
}));
vi.mock("@/features/meetings/history/server", () => ({
  getMeetingHistoryAccess: mocks.getMeetingHistoryAccess,
  queryMeetingHistory: mocks.queryMeetingHistory,
}));

import MeetingsPage from "./(history)/page";

const FICTIONAL_ITEM = {
  id: "00000000-0000-4000-8000-000000000020",
  startsAt: "2026-08-12T10:30:00.000Z",
  summary: "Reviewed a fictional committee workflow.",
  title: "Fictional committee meeting",
} as const;

function pageResult(items = [FICTIONAL_ITEM], totalCount = items.length) {
  return {
    items,
    page: 1,
    pageCount: Math.max(1, Math.ceil(totalCount / 8)),
    pageSize: 8,
    totalCount,
  };
}

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

    await expect(MeetingsPage({})).rejects.toThrow(
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

    const html = renderToStaticMarkup(await MeetingsPage({}));

    expect(html).toContain('data-feedback-state="permission"');
    expect(html).toContain("No meeting information has been displayed.");
    expect(html).not.toContain(FICTIONAL_ITEM.title);
    expect(mocks.queryMeetingHistory).not.toHaveBeenCalled();
  });

  it.each(["committee", "authorised"] as const)(
    "renders a freshly queried history list for a trusted %s user",
    async (role) => {
      mocks.getMeetingHistoryAccess.mockResolvedValue({
        context: {
          role,
          userId: "00000000-0000-4000-8000-000000000021",
        },
        ok: true,
      });
      mocks.queryMeetingHistory.mockResolvedValue({
        ok: true,
        result: pageResult(),
      });

      const html = renderToStaticMarkup(await MeetingsPage({}));

      expect(html).toContain(FICTIONAL_ITEM.title);
      expect(html).toContain('href="/meetings/new"');
      expect(html).toContain("Create meeting");
      expect(html).toContain(
        'href="/meetings/00000000-0000-4000-8000-000000000020"',
      );
      expect(html).not.toContain("00000000-0000-4000-8000-000000000021");
      expect(mocks.queryMeetingHistory).toHaveBeenCalledWith({
        page: 1,
        pageSize: 8,
        search: "",
        sort: "newest",
        time: "all",
      });
    },
  );

  it("passes normalised URL criteria to the server query", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      context: {
        canManageAccounts: false,
        role: "committee",
        userId: "00000000-0000-4000-8000-000000000024",
      },
      ok: true,
    });
    mocks.queryMeetingHistory.mockResolvedValue({
      ok: true,
      result: pageResult(),
    });

    const html = renderToStaticMarkup(
      await MeetingsPage({
        searchParams: Promise.resolve({
          page: "1",
          q: "  planning ",
          sort: "oldest",
          time: "past",
        }),
      }),
    );

    expect(mocks.queryMeetingHistory).toHaveBeenCalledWith({
      page: 1,
      pageSize: 8,
      search: "planning",
      sort: "oldest",
      time: "past",
    });
    expect(html).toContain('value="planning"');
    expect(html).toContain("Sorted by date · oldest first");
  });

  it("renders deletion confirmation from the safe URL state", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      context: {
        canManageAccounts: false,
        role: "committee",
        userId: "00000000-0000-4000-8000-000000000024",
      },
      ok: true,
    });
    mocks.queryMeetingHistory.mockResolvedValue({ ok: true, result: pageResult() });

    const html = renderToStaticMarkup(
      await MeetingsPage({ searchParams: Promise.resolve({ deleted: "1" }) }),
    );

    expect(html).toContain("Meeting deleted");
    expect(html).toContain("permanently deleted");
  });

  it("redirects an out-of-range page while preserving active filters", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      context: {
        canManageAccounts: false,
        role: "committee",
        userId: "00000000-0000-4000-8000-000000000025",
      },
      ok: true,
    });
    mocks.queryMeetingHistory.mockResolvedValue({
      ok: true,
      result: {
        ...pageResult([FICTIONAL_ITEM], 12),
        page: 9,
        pageCount: 2,
      },
    });

    await expect(
      MeetingsPage({
        searchParams: Promise.resolve({ page: "9", q: "planning" }),
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/meetings?q=planning&page=2");
  });

  it("renders the empty state", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      context: {
        role: "committee",
        userId: "00000000-0000-4000-8000-000000000022",
      },
      ok: true,
    });
    mocks.queryMeetingHistory.mockResolvedValue({
      ok: true,
      result: pageResult([]),
    });

    const html = renderToStaticMarkup(await MeetingsPage({}));

    expect(html).toContain('data-feedback-state="empty"');
    expect(html).toContain("No meetings recorded");
    expect(html).toContain('href="/meetings/new"');
    expect(html).toContain("Create meeting");
  });

  it("hides data when the query fails", async () => {
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

    const html = renderToStaticMarkup(await MeetingsPage({}));

    expect(html).toContain('data-feedback-state="error"');
    expect(html).not.toContain(FICTIONAL_ITEM.title);
  });

  it("fails closed when access resolution has a system error", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      ok: false,
      reason: "system-error",
    });

    const html = renderToStaticMarkup(await MeetingsPage({}));

    expect(html).toContain('data-feedback-state="error"');
    expect(html).not.toContain(FICTIONAL_ITEM.title);
    expect(mocks.queryMeetingHistory).not.toHaveBeenCalled();
  });
});
