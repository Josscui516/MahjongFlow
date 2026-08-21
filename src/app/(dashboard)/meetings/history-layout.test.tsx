import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getMeetingHistoryAccess: vi.fn(),
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
}));

import MeetingHistoryLayout from "./(history)/layout";
import MeetingHistoryLoading from "./(history)/loading";

describe("meeting history layout", () => {
  beforeEach(() => {
    mocks.getMeetingHistoryAccess.mockReset();
    mocks.redirect.mockClear();
  });

  it.each(["committee", "authorised"] as const)(
    "keeps the trusted %s back-office shell around the loading state",
    async (role) => {
      mocks.getMeetingHistoryAccess.mockResolvedValue({
        context: { role, userId: "fictional-user-id" },
        ok: true,
      });

      const html = renderToStaticMarkup(
        await MeetingHistoryLayout({ children: <MeetingHistoryLoading /> }),
      );

      expect(html).toContain("Desktop navigation");
      expect(html).toContain(
        `Role: ${role === "committee" ? "Committee" : "Authorised"}`,
      );
      expect(html).toContain('aria-current="page"');
      expect(html).toContain('data-feedback-state="loading"');
      expect(html).toContain("min-h-screen bg-slate-50");
    },
  );

  it("redirects an anonymous request before rendering the shell", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      ok: false,
      reason: "unauthenticated",
    });

    await expect(
      MeetingHistoryLayout({ children: <MeetingHistoryLoading /> }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fmeetings");
  });

  it("fails closed without navigation when the role is forbidden", async () => {
    mocks.getMeetingHistoryAccess.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const html = renderToStaticMarkup(
      await MeetingHistoryLayout({ children: <MeetingHistoryLoading /> }),
    );

    expect(html).toContain('data-feedback-state="permission"');
    expect(html).not.toContain("Desktop navigation");
    expect(html).not.toContain("Loading meeting history");
  });
});
