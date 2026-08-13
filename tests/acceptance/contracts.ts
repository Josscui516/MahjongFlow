export const ACCEPTANCE_SCENARIO_IDS = [
  "X-01",
  "X-02",
  "X-03",
  "X-04",
  "X-05",
  "X-06",
  "X-07",
] as const;

export type AcceptanceScenarioId = (typeof ACCEPTANCE_SCENARIO_IDS)[number];

export type AcceptanceObservation = Readonly<{
  passed: boolean;
  summary: string;
}>;

export type AcceptanceAdapter = () => Promise<AcceptanceObservation>;

export type AcceptanceAdapterRegistry = Partial<
  Readonly<Record<AcceptanceScenarioId, AcceptanceAdapter>>
>;

export type AcceptanceResult = Readonly<{
  id: AcceptanceScenarioId;
  status: "passed" | "failed" | "blocked";
  summary: string;
}>;

export const ACCEPTANCE_EXPECTATIONS: Readonly<
  Record<AcceptanceScenarioId, string>
> = {
  "X-01": "Valid back-office users can sign in, refresh, and sign out safely.",
  "X-02": "Invalid credentials create no session and do not enumerate accounts.",
  "X-03": "Anonymous page and server requests expose no back-office data.",
  "X-04": "Back-office roles share coordination access while sensitive access is authorised-only.",
  "X-05": "Committee users cannot bypass server or database permission boundaries.",
  "X-06": "Anonymous token operations expose only the minimum non-enumerating contract.",
  "X-07": "Loading, empty, success, permission, validation, and system failures terminate accessibly.",
};
