import { describe, expect, test, vi } from "vitest";

import { ACCEPTANCE_SCENARIO_IDS } from "./contracts";
import { FICTIONAL_ACCEPTANCE_FIXTURES } from "./fixtures";
import {
  assertSanitisedEvidence,
  runAcceptanceHarness,
  summariseM1,
} from "./harness";

describe("Sprint 2 acceptance harness", () => {
  test("reports every missing integration adapter as an explicit blocker", async () => {
    const results = await runAcceptanceHarness({});

    expect(results.map(({ id }) => id)).toEqual(ACCEPTANCE_SCENARIO_IDS);
    expect(results.every(({ status }) => status === "blocked")).toBe(true);
    expect(results[0]?.summary).toContain("Missing integration adapter for X-01");
  });

  test("records pass, contract failure, and safe adapter failure without false success", async () => {
    const results = await runAcceptanceHarness({
      "X-01": vi.fn(async () => ({ passed: true, summary: "X-01 passed." })),
      "X-02": vi.fn(async () => ({ passed: false, summary: "No session was asserted." })),
      "X-03": vi.fn(async () => {
        throw new Error("provider detail must not escape");
      }),
    });

    expect(results.slice(0, 3)).toEqual([
      { id: "X-01", status: "passed", summary: "X-01 passed." },
      { id: "X-02", status: "failed", summary: "No session was asserted." },
      {
        id: "X-03",
        status: "failed",
        summary: "X-03 adapter failed without exposing provider details.",
      },
    ]);
  });

  test("uses only deterministic fictional fixture identities", () => {
    expect(FICTIONAL_ACCEPTANCE_FIXTURES.committee.email).toMatch(/@example\.test$/);
    expect(FICTIONAL_ACCEPTANCE_FIXTURES.authorised.role).toBe("authorised");
    expect(FICTIONAL_ACCEPTANCE_FIXTURES.noProfile.userId).not.toBe(
      FICTIONAL_ACCEPTANCE_FIXTURES.committee.userId,
    );
  });

  test("rejects sensitive evidence keys and text recursively", () => {
    expect(() =>
      assertSanitisedEvidence({ command: "npm test", result: "passed" }),
    ).not.toThrow();
    expect(() => assertSanitisedEvidence({ session: "redacted" })).toThrow(
      /Sensitive evidence field/,
    );
    expect(() =>
      assertSanitisedEvidence({ details: ["password=fictional-value"] }),
    ).toThrow(/Sensitive evidence text/);
  });

  test("cannot report M1 success with a failed scenario or missing review", () => {
    const passedResults = ACCEPTANCE_SCENARIO_IDS.map((id) => ({
      id,
      status: "passed" as const,
      summary: `${id} passed.`,
    }));

    expect(summariseM1(passedResults, false)).toMatchObject({ status: "blocked" });
    expect(
      summariseM1(
        passedResults.map((result) =>
          result.id === "X-07" ? { ...result, status: "blocked" as const } : result,
        ),
        true,
      ),
    ).toMatchObject({ status: "blocked" });
    expect(summariseM1(passedResults, true)).toEqual({
      status: "passed",
      blockers: [],
    });
  });
});
