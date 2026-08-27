import {
  DECISION_TO_TASK_SCENARIO_IDS,
  type DecisionToTaskAcceptanceResult,
  type DecisionToTaskAdapterRegistry,
  type Sprint4DeliveryGates,
} from "./contracts";

export async function runDecisionToTaskAcceptance(
  adapters: DecisionToTaskAdapterRegistry,
): Promise<DecisionToTaskAcceptanceResult[]> {
  const results: DecisionToTaskAcceptanceResult[] = [];

  for (const id of DECISION_TO_TASK_SCENARIO_IDS) {
    const adapter = adapters[id];
    if (!adapter) {
      results.push({
        id,
        status: "blocked",
        summary: `Missing integrated adapter for ${id}.`,
      });
      continue;
    }

    try {
      const observation = await adapter();
      results.push({
        id,
        status: observation.passed ? "passed" : "failed",
        summary: observation.summary,
      });
    } catch {
      results.push({
        id,
        status: "failed",
        summary: `${id} failed without exposing provider details.`,
      });
    }
  }

  return results;
}

export function summariseSprint4Delivery(
  results: readonly DecisionToTaskAcceptanceResult[],
  gates: Sprint4DeliveryGates,
) {
  const blockers = results
    .filter((result) => result.status !== "passed")
    .map((result) => `${result.id}: ${result.summary}`);

  const gateLabels: Readonly<Record<keyof Sprint4DeliveryGates, string>> = {
    childWorkPackagesIntegrated: "All child work packages must be integrated.",
    nonAuthorReviewsVerified: "Independent non-author reviews must be verified.",
    projectSprintMembershipVerified:
      "GitHub Project Sprint membership and status must be verified.",
    stakeholderReviewRecorded: "The Stakeholder stage review must be recorded.",
  };

  for (const [gate, passed] of Object.entries(gates) as [
    keyof Sprint4DeliveryGates,
    boolean,
  ][]) {
    if (!passed) blockers.push(gateLabels[gate]);
  }

  return {
    blockers,
    deliveryStatus: blockers.length === 0 ? ("passed" as const) : ("blocked" as const),
    technicalStatus: results.every((result) => result.status === "passed")
      ? ("passed" as const)
      : ("blocked" as const),
  };
}
