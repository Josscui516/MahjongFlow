import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireBackendUser: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireBackendUser: mocks.requireBackendUser,
}));
vi.mock("server-only", () => ({}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => {
    mocks.requireBackendUser.mockReset();
  });

  it("derives the Dashboard user from the protected server session", async () => {
    mocks.requireBackendUser.mockResolvedValue({
      canManageAccounts: false,
      role: "committee",
      userId: "fictional-committee-user",
    });
    const html = renderToStaticMarkup(await DashboardPage());
    expect(mocks.requireBackendUser).toHaveBeenCalledTimes(1);
    expect(html).toContain("Dashboard");
    expect(html).toContain("Task summaries are waiting for the shared task query provider.");
    expect(html).not.toContain("fictional-committee-user");
  });

  it("does not render Dashboard data when server authorisation fails", async () => {
    mocks.requireBackendUser.mockRejectedValue(new Error("unauthenticated"));
    await expect(DashboardPage()).rejects.toThrow("unauthenticated");
  });
});
