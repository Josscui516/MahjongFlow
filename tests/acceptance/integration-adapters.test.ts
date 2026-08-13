import { describe, expect, test } from "vitest";

import { ACCEPTANCE_SCENARIO_IDS } from "./contracts";
import {
  createIntegratedAcceptanceAdapters,
  INTEGRATED_ACCEPTANCE_EVIDENCE,
} from "./integration-adapters";
import {
  assertSanitisedEvidence,
  runAcceptanceHarness,
  summariseM1,
} from "./harness";

describe("Sprint 2 integrated acceptance adapters", () => {
  test("binds every X-01 through X-07 contract to sanitised evidence", async () => {
    expect(Object.keys(INTEGRATED_ACCEPTANCE_EVIDENCE)).toEqual(
      ACCEPTANCE_SCENARIO_IDS,
    );
    expect(() =>
      assertSanitisedEvidence({ evidence: INTEGRATED_ACCEPTANCE_EVIDENCE }),
    ).not.toThrow();

    const results = await runAcceptanceHarness(
      createIntegratedAcceptanceAdapters(),
    );

    expect(results).toHaveLength(ACCEPTANCE_SCENARIO_IDS.length);
    expect(results.every(({ status }) => status === "passed")).toBe(true);
    expect(summariseM1(results, true)).toEqual({
      status: "passed",
      blockers: [],
    });
  });
});
