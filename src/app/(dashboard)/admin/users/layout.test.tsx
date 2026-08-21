import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => {
  class TestAuthorizationError extends Error {
    readonly code: "FORBIDDEN" | "UNAUTHENTICATED";

    constructor(code: "FORBIDDEN" | "UNAUTHENTICATED") {
      super(code);
      this.code = code;
    }
  }

  return {
    AuthorizationError: TestAuthorizationError,
    redirect: vi.fn((destination: string) => {
      throw new Error(`NEXT_REDIRECT:${destination}`);
    }),
    requireAccountAdmin: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/auth/authorization", () => ({
  AuthorizationError: mocks.AuthorizationError,
  requireAccountAdmin: mocks.requireAccountAdmin,
}));
vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <button type="button">Sign out</button>,
}));

import AccountManagementLayout from "./layout";
import AccountManagementLoading from "./loading";

describe("account-management route layout", () => {
  beforeEach(() => {
    mocks.redirect.mockClear();
    mocks.requireAccountAdmin.mockReset();
  });

  it("keeps the trusted shell around the loading state", async () => {
    mocks.requireAccountAdmin.mockResolvedValue({
      canManageAccounts: true,
      displayName: "Fictional Administrator",
      role: "authorised",
      userId: "fictional-admin-id",
    });

    const html = renderToStaticMarkup(
      await AccountManagementLayout({ children: <AccountManagementLoading /> }),
    );

    expect(html).toContain("Desktop navigation");
    expect(html).toContain("Fictional Administrator");
    expect(html).toContain('data-feedback-state="loading"');
    expect(html).toContain("Loading committee accounts");
  });

  it("redirects an anonymous request to the exact protected path", async () => {
    mocks.requireAccountAdmin.mockRejectedValue(
      new mocks.AuthorizationError("UNAUTHENTICATED"),
    );

    await expect(
      AccountManagementLayout({ children: <AccountManagementLoading /> }),
    ).rejects.toThrow("NEXT_REDIRECT:/login?next=%2Fadmin%2Fusers");
  });

  it("fails closed without exposing the account directory", async () => {
    mocks.requireAccountAdmin.mockRejectedValue(
      new mocks.AuthorizationError("FORBIDDEN"),
    );

    const html = renderToStaticMarkup(
      await AccountManagementLayout({ children: <p>Protected directory</p> }),
    );

    expect(html).toContain('data-feedback-state="permission"');
    expect(html).not.toContain("Protected directory");
    expect(html).not.toContain("Desktop navigation");
  });
});
