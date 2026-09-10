import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listTasks: vi.fn(),
  requireBackendUser: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireBackendUser: mocks.requireBackendUser,
}));
vi.mock("@/features/tasks/core/service", () => ({ listTasks: mocks.listTasks }));
vi.mock("server-only", () => ({}));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => {
    mocks.requireBackendUser.mockReset();
    mocks.listTasks.mockReset();
    mocks.listTasks.mockResolvedValue({ items: [], ok: true, total: 0 });
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
    expect(html).toContain("You have no unfinished tasks.");
    expect(html).toContain("There are no unfinished committee tasks.");
    expect(html).not.toContain("Task summaries are waiting for the shared task query provider.");
    expect(html).not.toContain("fictional-committee-user");
    expect(mocks.listTasks).toHaveBeenCalledTimes(8);
    expect(mocks.listTasks.mock.calls.filter(([criteria]) => criteria.assigneeId === "fictional-committee-user")).toHaveLength(2);
  });

  it("does not render Dashboard data when server authorisation fails", async () => {
    mocks.requireBackendUser.mockRejectedValue(new Error("unauthenticated"));
    await expect(DashboardPage()).rejects.toThrow("unauthenticated");
  });
});
