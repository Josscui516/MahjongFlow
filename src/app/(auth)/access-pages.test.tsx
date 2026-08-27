import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

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
import RegistrationsPage from "@/app/(auth)/registrations/page";
import { AuthorizationError } from "@/lib/auth/authorization";

beforeEach(() => {
  authMocks.requireAuthorised.mockReset();
  authMocks.requireBackendUser.mockReset();
});

describe("integrated role-aware pages", () => {
  test.each(["committee", "authorised"] as const)(
    "renders the trusted %s role in the back-office shell",
    async (role) => {
      authMocks.requireBackendUser.mockResolvedValue({
        canManageAccounts: false,
        displayName: "Fictional committee member",
        role,
        userId: "fictional-user-id",
      });

      const html = renderToStaticMarkup(await BackofficePage());

      expect(html).toContain(`Role: ${role === "authorised" ? "Authorised" : "Committee"}`);
      expect(html).toContain("Committee dashboard");
      expect(html).toContain("Fictional committee member");
      expect(html).not.toContain('href="/registrations"');
    },
  );

  test("denies a committee user before rendering registration content", async () => {
    authMocks.requireAuthorised.mockRejectedValue(
      new AuthorizationError("FORBIDDEN"),
    );

    const html = renderToStaticMarkup(await RegistrationsPage());

    expect(html).toContain("You cannot access this page");
    expect(html).not.toContain("Registration module not started");
  });

  test("shows only a fictional empty state to an authorised user", async () => {
    authMocks.requireAuthorised.mockResolvedValue({
      role: "authorised",
      userId: "fictional-authorised-id",
    });

    const html = renderToStaticMarkup(await RegistrationsPage());

    expect(html).toContain("Role: Authorised");
    expect(html).toContain("Registration module not started");
    expect(html).toContain("No participant data is loaded");
  });
});
