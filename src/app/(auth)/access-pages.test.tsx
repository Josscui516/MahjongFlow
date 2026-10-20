import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); },
}));
vi.mock("@/features/events/core/service", () => ({ listEvents: async () => ({ ok: true, items: [] }) }));

const authMocks = vi.hoisted(() => ({
  requireAuthorised: vi.fn(),
  requireBackendUser: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => {
  class AuthorizationError extends Error {
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN";

    constructor(code: "UNAUTHENTICATED" | "FORBIDDEN") {
      super(code);
      this.code = code;
    }
  }

  return { AuthorizationError, ...authMocks };
});

vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <button type="button">Sign out</button>,
}));

import BackofficePage from "@/app/(auth)/backoffice/page";
import DashboardLayout from "@/app/(dashboard)/dashboard/layout";
import RegistrationsPage from "@/app/(auth)/registrations/page";
import { AuthorizationError } from "@/lib/auth/authorization";

beforeEach(() => {
  authMocks.requireBackendUser.mockReset();
  authMocks.requireBackendUser.mockReset();
});

describe("integrated role-aware pages", () => {
  test("sends the old committee dashboard entry to the single Dashboard", () => {
    expect(() => BackofficePage()).toThrow("NEXT_REDIRECT:/dashboard");
  });
  test.each(["committee", "authorised"] as const)(
    "renders the trusted %s role in the back-office shell",
    async (role) => {
      authMocks.requireBackendUser.mockResolvedValue({
        canManageAccounts: false,
        displayName: "Fictional committee member",
        role,
        userId: "fictional-user-id",
      });

      const html = renderToStaticMarkup(await DashboardLayout({ children: <h1>Dashboard</h1> }));

      expect(html).toContain(`Role: ${role === "authorised" ? "Authorised" : "Committee"}`);
      expect(html).toContain("Dashboard");
      expect(html).toContain("Fictional committee member");
      expect(html).toContain('href="/registrations"');
    },
  );

  test("denies inactive or missing-profile users before rendering registration content", async () => {
    authMocks.requireBackendUser.mockRejectedValue(
      new AuthorizationError("FORBIDDEN"),
    );

    const html = renderToStaticMarkup(await RegistrationsPage());

    expect(html).toContain("You cannot access this page");
    expect(html).not.toContain("Registration module not started");
  });

  test("shows only a fictional empty state to an authorised user", async () => {
    authMocks.requireBackendUser.mockResolvedValue({
      role: "authorised",
      userId: "fictional-authorised-id",
    });

    const html = renderToStaticMarkup(await RegistrationsPage());

    expect(html).toContain("Role: Authorised");
    expect(html).toContain("No events available");
    expect(html).toContain("Create an event before registering participants");
  });
});
