import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
    listAccounts: vi.fn(),
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
vi.mock("@/features/account-management", () => ({
  AccountDirectory: ({ accounts }: { accounts: readonly unknown[] }) => (
    <p>Directory count: {accounts.length}</p>
  ),
  getAccountManagementService: async () => ({
    listAccounts: mocks.listAccounts,
  }),
  InviteAccountForm: () => <form>Invite form</form>,
}));
vi.mock("@/app/(auth)/backoffice/logout-form", () => ({
  LogoutForm: () => <form>Sign out</form>,
}));

import AccountManagementPage from "./page";

describe("account-management page", () => {
  beforeEach(() => {
    mocks.listAccounts.mockReset();
    mocks.redirect.mockClear();
    mocks.requireAccountAdmin.mockReset();
  });

  it("redirects an anonymous request before loading the Auth directory", async () => {
    mocks.requireAccountAdmin.mockRejectedValue(
      new mocks.AuthorizationError("UNAUTHENTICATED"),
    );

    await expect(AccountManagementPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?next=%2Fadmin%2Fusers",
    );
    expect(mocks.listAccounts).not.toHaveBeenCalled();
  });

  it("returns a fixed denial without loading accounts for a non-admin", async () => {
    mocks.requireAccountAdmin.mockRejectedValue(
      new mocks.AuthorizationError("FORBIDDEN"),
    );

    const html = renderToStaticMarkup(await AccountManagementPage());

    expect(html).toContain("Access required");
    expect(html).not.toContain("Directory count");
    expect(mocks.listAccounts).not.toHaveBeenCalled();
  });

  it("renders the protected account workflow for an account administrator", async () => {
    mocks.requireAccountAdmin.mockResolvedValue({
      canManageAccounts: true,
      role: "committee",
      userId: "fictional-admin-id",
    });
    mocks.listAccounts.mockResolvedValue([
      {
        displayName: "Fictional Member",
        id: "fictional-profile-id",
      },
    ]);

    const html = renderToStaticMarkup(await AccountManagementPage());

    expect(html).toContain("Committee accounts");
    expect(html).toContain("Invite form");
    expect(html).toContain("Directory count: 1");
    expect(html).toContain('href="/admin/users"');
    expect(html).not.toContain("fictional-admin-id");
  });
});
