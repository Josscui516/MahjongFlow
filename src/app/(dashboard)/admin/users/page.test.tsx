import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import AccountManagementPage from "./page";

describe("account-management page", () => {
  beforeEach(() => {
    mocks.listAccounts.mockReset();
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
});
