import "server-only";

import type { DashboardTaskQuery } from "./contracts";

/** Replaced by Issue #20's real TaskFollowUpQuery during Sprint integration. */
export function createUnconnectedDashboardTaskQuery(): DashboardTaskQuery {
  return {
    async querySection({ key }) {
      return { code: "UPSTREAM_NOT_CONNECTED", key, ok: false };
    },
  };
}
