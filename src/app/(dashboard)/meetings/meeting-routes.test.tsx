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

vi.mock("@/lib/auth/authorization", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/authorization")>();
  return { ...actual, requireBackendUser: authMocks.requireBackendUser };
});

vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <form><button type="submit">Sign out</button></form>,
}));

import MeetingDetailPage from "@/app/(dashboard)/meetings/[meetingId]/page";
import NewMeetingPage from "@/app/(dashboard)/meetings/new/page";
import { AuthorizationError } from "@/lib/auth/authorization";

describe("meeting editor routes", () => {
  beforeEach(() => {
    authMocks.requireBackendUser.mockReset();
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

  it("renders a safe loading state while the browser fixture is read", async () => {
    authMocks.requireBackendUser.mockResolvedValue({
      role: "authorised",
      userId: "fictional-user",
    });

    const html = renderToStaticMarkup(
      await MeetingDetailPage({
        params: Promise.resolve({ meetingId: "fixture-weekly-committee" }),
      }),
    );

    expect(html).toContain("Loading meeting details");
    expect(html).not.toContain("Weekly committee meeting");
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

  it("returns fixed denial copy without meeting content for a forbidden role", async () => {
    authMocks.requireBackendUser.mockRejectedValue(
      new AuthorizationError("FORBIDDEN"),
    );

    const html = renderToStaticMarkup(
      await MeetingDetailPage({
        params: Promise.resolve({ meetingId: "fixture-weekly-committee" }),
      }),
    );

    expect(html).toContain("Access required");
    expect(html).not.toContain("Weekly committee meeting");
    expect(html).not.toContain("Alex Example");
  });
});
