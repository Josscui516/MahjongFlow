import {
  ACCEPTANCE_EXPECTATIONS,
  ACCEPTANCE_SCENARIO_IDS,
  type AcceptanceAdapterRegistry,
  type AcceptanceResult,
} from "./contracts";

const SENSITIVE_EVIDENCE_KEY =
  /(?:password|passwd|secret|token|session|cookie|authorization|service[_-]?role|participant(?:_?name|_?email)?)/i;
const SENSITIVE_EVIDENCE_TEXT =
  /(?:bearer\s+[a-z0-9._~-]+|eyj[a-z0-9_-]*\.[a-z0-9_-]+\.[a-z0-9_-]+|(?:password|secret|token|session|cookie)\s*[:=]\s*\S+)/i;

export async function runAcceptanceHarness(
  adapters: AcceptanceAdapterRegistry,
): Promise<AcceptanceResult[]> {
  const results: AcceptanceResult[] = [];

  for (const id of ACCEPTANCE_SCENARIO_IDS) {
    const adapter = adapters[id];
    if (!adapter) {
      results.push({
        id,
        status: "blocked",
        summary: `Missing integration adapter for ${id}: ${ACCEPTANCE_EXPECTATIONS[id]}`,
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
        summary: `${id} adapter failed without exposing provider details.`,
      });
    }
  }

  return results;
}

export function assertSanitisedEvidence(
  evidence: Readonly<Record<string, unknown>>,
): void {
  const visit = (value: unknown, path: string): void => {
    if (typeof value === "string") {
      if (SENSITIVE_EVIDENCE_TEXT.test(value)) {
        throw new Error(`Sensitive evidence text is not allowed at ${path}.`);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (SENSITIVE_EVIDENCE_KEY.test(key)) {
          throw new Error(`Sensitive evidence field is not allowed at ${path}.${key}.`);
        }
        visit(child, `${path}.${key}`);
      }
    }
  };

  visit(evidence, "evidence");
}

export function summariseM1(
  results: readonly AcceptanceResult[],
  independentReviewPassed: boolean,
): Readonly<{
  status: "passed" | "blocked";
  blockers: string[];
}> {
  const blockers = results
    .filter((result) => result.status !== "passed")
    .map((result) => `${result.id}: ${result.summary}`);

  if (!independentReviewPassed) {
    blockers.push("Independent non-author review is missing or not approved.");
  }

  return {
    status: blockers.length === 0 ? "passed" : "blocked",
    blockers,
  };
}
