import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { DECISION_TO_TASK_SCENARIO_IDS } from "./contracts";
import { runDecisionToTaskAcceptance, summariseSprint4Delivery } from "./harness";
import { createDecisionToTaskIntegrationAdapters } from "./integration-adapters";

describe("Sprint 4 decision-to-task acceptance harness", () => {
  it("blocks every scenario whose public integration adapter is missing", async () => {
    const results = await runDecisionToTaskAcceptance({});

    expect(results.map(({ id }) => id)).toEqual(DECISION_TO_TASK_SCENARIO_IDS);
    expect(results.every(({ status }) => status === "blocked")).toBe(true);
  });

  it("passes C-01 through C-07 through the integrated public boundaries", async () => {
    const results = await runDecisionToTaskAcceptance(
      createDecisionToTaskIntegrationAdapters(),
    );

    expect(results).toHaveLength(7);
    expect(results.every(({ status }) => status === "passed")).toBe(true);
    expect(
      summariseSprint4Delivery(results, {
        childWorkPackagesIntegrated: true,
        nonAuthorReviewsVerified: true,
        projectSprintMembershipVerified: true,
        stakeholderReviewRecorded: true,
      }),
    ).toEqual({ blockers: [], deliveryStatus: "passed", technicalStatus: "passed" });
  });

  it("keeps delivery blocked when review or Project evidence is absent", async () => {
    const results = await runDecisionToTaskAcceptance(
      createDecisionToTaskIntegrationAdapters(),
    );
    const summary = summariseSprint4Delivery(results, {
      childWorkPackagesIntegrated: true,
      nonAuthorReviewsVerified: false,
      projectSprintMembershipVerified: false,
      stakeholderReviewRecorded: false,
    });

    expect(summary.technicalStatus).toBe("passed");
    expect(summary.deliveryStatus).toBe("blocked");
    expect(summary.blockers).toHaveLength(3);
  });
});
