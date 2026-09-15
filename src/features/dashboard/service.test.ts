import { describe, expect, it, vi } from "vitest";

import type { DashboardTaskQuery } from "./contracts";
import { loadDashboardSnapshot } from "./service";

describe("loadDashboardSnapshot", () => {
  it("uses one trusted user and one fixed clock for every section", async () => {
    const now = new Date("2026-09-09T01:00:00.000Z");
    const querySection = vi.fn<DashboardTaskQuery["querySection"]>(async ({ key }) => ({ ok: true, section: { items: [], key, total: 0 } }));
    const snapshot = await loadDashboardSnapshot("fictional-user", now, { querySection });
    expect(snapshot.capturedAt).toBe(now.toISOString());
    expect(querySection).toHaveBeenCalledTimes(4);
    expect(querySection.mock.calls.every(([input]) => input.userId === "fictional-user" && input.now === now)).toBe(true);
  });

  it("keeps a failed section independent from successful sections", async () => {
    const querySection = vi.fn<DashboardTaskQuery["querySection"]>(async ({ key }) => {
      if (key === "overdue") throw new Error("fictional failure");
      return { ok: true, section: { items: [], key, total: 0 } };
    });
    const snapshot = await loadDashboardSnapshot("fictional-user", new Date("2026-09-09T01:00:00.000Z"), { querySection });
    expect(snapshot.sections.filter((result) => result.ok)).toHaveLength(3);
    expect(snapshot.sections).toContainEqual({ code: "SYSTEM_ERROR", key: "overdue", ok: false });
  });
});
