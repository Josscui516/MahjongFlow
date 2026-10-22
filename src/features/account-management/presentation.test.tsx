import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));

vi.mock("./actions", () => ({
  inviteAccountAction: vi.fn(), sendRecoveryAction: vi.fn(),
  setAccountActiveAction: vi.fn(), updateAccountAction: vi.fn(),
}));
vi.mock("@/features/account-management", () => ({
  AccountDirectory, InviteAccountForm,
  getAccountManagementService: async () => ({ listAccounts: async () => accounts }),
}));

import { AccountDirectory, InviteAccountForm } from "./AccountManagementView";
import type { ManagedAccount } from "./contracts";
import AccountManagementPage from "@/app/(dashboard)/admin/users/page";

const accounts: ManagedAccount[] = [
  { id: "fictional-admin", displayName: "Admin", email: "admin@example.test", committeePosition: null, role: "authorised", canManageAccounts: true, isCurrentUser: true, status: "active" },
  { id: "fictional-member", displayName: "Member", email: "member@example.test", committeePosition: null, role: "committee", canManageAccounts: false, isCurrentUser: false, status: "disabled" },
];

describe("account presentation", () => {
  test("keeps invitations collapsed so the directory is available immediately", async () => {
    const html = renderToStaticMarkup(await AccountManagementPage());
    expect(html).toContain("Invite member");
    expect(html).not.toMatch(/<details[^>]*\bopen(?:=|\s|>)/);
    expect(html).toContain('id="account-directory-title"');
  });

  test("hides the current account and removes role explanations and administration controls", () => {
    const html = renderToStaticMarkup(<AccountDirectory accounts={accounts} />);
    expect(html).not.toContain("admin@example.test");
    expect(html).toContain("member@example.test");
    expect(html).toContain("Committee");
    expect(html).not.toContain("Committee coordination");
    expect(html).not.toContain("Committee position");
    expect(html).not.toContain("Account administrator");
    expect(html).not.toContain("Data access role");
    expect(html).toContain("Reactivate account");
  });

  test("offers only name, email and role on invitations", () => {
    const html = renderToStaticMarkup(<InviteAccountForm />);
    expect(html).toContain('name="role"');
    expect(html).not.toContain('name="canManageAccounts"');
    expect(html).not.toContain('name="committeePosition"');
    expect(html).not.toContain("Display name");
    expect(html).not.toContain("Login email");
    expect(html).not.toContain("Superusers");
  });

  test("limits large directories to ten visible accounts with page controls", () => {
    const many = Array.from({length: 23}, (_, index) => ({...accounts[1], id:`member-${index}`, email:`member${index}@example.test`}));
    const html = renderToStaticMarkup(<AccountDirectory accounts={many} />);
    expect(html.match(/<article /g)).toHaveLength(10);
    expect(html).toContain("Page 1 of 3");
    expect(html).toContain('aria-label="Account pages"');
    expect(html).toContain("Search accounts");
    expect(html).toContain("All statuses");
  });

  test("preserves existing hidden profile values when editing another account", () => {
    const html = renderToStaticMarkup(<AccountDirectory accounts={[{
      ...accounts[0], isCurrentUser: false, committeePosition: "Secretary",
    }]} />);
    expect(html).toMatch(/<input(?=[^>]*name="committeePosition")(?=[^>]*type="hidden")(?=[^>]*value="Secretary")[^>]*>/);
    expect(html).toMatch(/<input(?=[^>]*name="canManageAccounts")(?=[^>]*type="hidden")(?=[^>]*value="on")[^>]*>/);
    expect(html).not.toContain('type="checkbox"');
  });
});
