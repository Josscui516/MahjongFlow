import { describe, expect, it, vi } from "vitest";

import { MEETING_HISTORY_QUERY_ERROR } from "./contracts";
import { resolveMeetingHistoryScreen } from "./screen-state";

describe("meeting history screen state", () => {
  it.each(["unauthenticated", "forbidden"] as const)(
    "does not query meetings when access is %s",
    async (reason) => {
      const queryHistory = vi.fn();

      const state = await resolveMeetingHistoryScreen({
        getAccess: async () => ({ ok: false, reason }),
        queryHistory,
      });

      expect(state).toEqual({
        status: reason === "forbidden" ? "permission-denied" : reason,
      });
      expect(queryHistory).not.toHaveBeenCalled();
    },
  );

  it("checks access before querying and returns the safe projection", async () => {
    const order: string[] = [];
    const item = {
      id: "meeting-id",
      startsAt: "2026-08-12T10:30:00.000Z",
      summary: null,
      title: "Fictional meeting",
    } as const;

    const state = await resolveMeetingHistoryScreen({
      getAccess: async () => {
        order.push("access");
        return {
          context: { role: "committee", userId: "fictional-user-id" },
          ok: true,
        };
      },
      queryHistory: async () => {
        order.push("query");
        return { items: [item], ok: true };
      },
    });

    expect(order).toEqual(["access", "query"]);
    expect(state).toEqual({
      items: [item],
      role: "committee",
      status: "ready",
    });
    expect(JSON.stringify(state)).not.toContain("fictional-user-id");
    expect(JSON.stringify(state)).not.toContain("userId");
  });

  it("keeps an authenticated shell role while hiding failed query data", async () => {
    const state = await resolveMeetingHistoryScreen({
      getAccess: async () => ({
        context: { role: "authorised", userId: "fictional-user-id" },
        ok: true,
      }),
      queryHistory: async () => ({
        error: MEETING_HISTORY_QUERY_ERROR,
        ok: false,
      }),
    });

    expect(state).toEqual({ role: "authorised", status: "system-error" });
    expect(JSON.stringify(state)).not.toContain("meeting");
  });

  it("fails closed when access resolution throws", async () => {
    const queryHistory = vi.fn();

    const state = await resolveMeetingHistoryScreen({
      getAccess: async () => {
        throw new Error("provider detail");
      },
      queryHistory,
    });

    expect(state).toEqual({ status: "system-error" });
    expect(queryHistory).not.toHaveBeenCalled();
  });
});
