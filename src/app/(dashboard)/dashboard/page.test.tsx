import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listTasks: vi.fn(),
  requireBackendUser: vi.fn(),
  upcoming: vi.fn(),
}));

vi.mock("@/lib/auth/authorization", () => ({
  requireBackendUser: mocks.requireBackendUser,
}));
vi.mock("@/features/tasks/core/service", () => ({ listTasks: mocks.listTasks }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/dashboard/upcoming-events/real-adapter", () => ({ createRealUpcomingEventsPort: () => ({ listUpcoming: mocks.upcoming }) }));

import DashboardPage from "./page";

describe("DashboardPage", () => {
  beforeEach(() => {
    mocks.requireBackendUser.mockReset();
    mocks.listTasks.mockReset();
    mocks.listTasks.mockResolvedValue({ items: [], ok: true, total: 0 });
    mocks.upcoming.mockResolvedValue({ state: "ready", events: [{ id: "fictional-event", name: "Real provider fixture", location: "Fictional Room", startsAt: "2026-09-20T00:00:00Z" }] });
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
    expect(html).toContain("Real provider fixture");
    expect(html).not.toContain("not connected");
    expect(mocks.upcoming).toHaveBeenCalledWith(expect.any(Date));
    expect(html).toContain("You have no unfinished tasks.");
    expect(html).toContain("There are no unfinished committee tasks.");
    expect(html).not.toContain("Task summaries are waiting for the shared task query provider.");
    expect(html).not.toContain("fictional-committee-user");
    expect(mocks.listTasks).toHaveBeenCalledTimes(2);
    expect(mocks.listTasks.mock.calls.every(([criteria]) => criteria.assigneeId === undefined)).toBe(true);
  });

  it("does not render Dashboard data when server authorisation fails", async () => {
    mocks.requireBackendUser.mockRejectedValue(new Error("unauthenticated"));
    await expect(DashboardPage()).rejects.toThrow("unauthenticated");
  });
});
