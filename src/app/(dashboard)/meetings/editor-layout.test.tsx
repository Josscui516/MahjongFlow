import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((destination: string) => {
    throw new Error(`NEXT_REDIRECT:${destination}`);
  }),
  requireBackendUser: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/auth/authorization")
  >();

  return {
    ...actual,
    requireBackendUser: mocks.requireBackendUser,
  };
});
vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <button type="button">Sign out</button>,
}));

import NewMeetingError from "./new/error";
import NewMeetingLoading from "./new/loading";
import { MeetingEditorRouteLayout } from "@/features/meetings/editor/MeetingEditorRouteLayout";
import { AuthorizationError } from "@/lib/auth/authorization";

describe("meeting editor route layout", () => {
  beforeEach(() => {
    mocks.redirect.mockClear();
    mocks.requireBackendUser.mockReset();
  });

  it.each(["committee", "authorised"] as const)(
    "keeps the trusted %s shell around editor loading",
    async (role) => {
      mocks.requireBackendUser.mockResolvedValue({
        role,
        userId: "fictional-user-id",
      });

      const html = renderToStaticMarkup(
        await MeetingEditorRouteLayout({
          children: <NewMeetingLoading />,
          currentPath: "/meetings/new",
          loginNextPath: "/meetings/new",
        }),
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

  it("keeps the trusted shell around an editor route error", async () => {
    mocks.requireBackendUser.mockResolvedValue({
      role: "authorised",
      userId: "fictional-user-id",
    });

    const html = renderToStaticMarkup(
      await MeetingEditorRouteLayout({
        children: (
          <NewMeetingError
            error={Object.assign(new Error("private provider response"), {
              digest: "safe-digest",
            })}
            retry={vi.fn()}
          />
        ),
        currentPath: "/meetings/new",
        loginNextPath: "/meetings/new",
      }),
    );

    expect(html).toContain("Desktop navigation");
    expect(html).toContain('data-feedback-state="error"');
    expect(html).toContain("The meeting editor is unavailable");
  });

  it("redirects an anonymous request to the exact protected editor path", async () => {
    mocks.requireBackendUser.mockRejectedValue(
      new AuthorizationError("UNAUTHENTICATED"),
    );

    await expect(
      MeetingEditorRouteLayout({
        children: <NewMeetingLoading />,
        currentPath: "/meetings/new",
        loginNextPath: "/meetings/new",
      }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fmeetings%2Fnew");
  });
});
