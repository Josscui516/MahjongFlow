import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/lib/auth/authorization";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  listAccounts: vi.fn(),
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

import AccountManagementPage, { dynamic } from "./page";

describe("account-management page", () => {
  beforeEach(() => {
    mocks.listAccounts.mockReset();
  });

  it("renders only at request time because the Auth Admin client needs server secrets", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the account workflow after its protected layout resolves", async () => {
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
  });

  it("lets unexpected directory failures reach the route error boundary", async () => {
    mocks.listAccounts.mockRejectedValue(new Error("private provider response"));

    await expect(AccountManagementPage()).rejects.toThrow(
      "private provider response",
    );
  });

  it("renders a safe denial when the concurrent page read is forbidden", async () => {
    mocks.listAccounts.mockRejectedValue(new AuthorizationError("FORBIDDEN"));
    const html = renderToStaticMarkup(await AccountManagementPage());
    expect(html).toContain("You cannot access this page");
    expect(html).not.toContain("Directory count");
  });
});
