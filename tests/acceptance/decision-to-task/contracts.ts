export const DECISION_TO_TASK_SCENARIO_IDS = [
  "C-01",
  "C-02",
  "C-03",
  "C-04",
  "C-05",
  "C-06",
  "C-07",
] as const;

export type DecisionToTaskScenarioId =
  (typeof DECISION_TO_TASK_SCENARIO_IDS)[number];

export type DecisionToTaskObservation = Readonly<{
  passed: boolean;
  summary: string;
}>;

export type DecisionToTaskAdapter = () => Promise<DecisionToTaskObservation>;

export type DecisionToTaskAdapterRegistry = Partial<
  Readonly<Record<DecisionToTaskScenarioId, DecisionToTaskAdapter>>
>;

export type DecisionToTaskAcceptanceResult = Readonly<{
  id: DecisionToTaskScenarioId;
  status: "blocked" | "failed" | "passed";
  summary: string;
}>;

export type Sprint4DeliveryGates = Readonly<{
  childWorkPackagesIntegrated: boolean;
  nonAuthorReviewsVerified: boolean;
  projectSprintMembershipVerified: boolean;
  stakeholderReviewRecorded: boolean;
}>;
