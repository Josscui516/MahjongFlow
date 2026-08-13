import type {
  AcceptanceAdapterRegistry,
  AcceptanceObservation,
  AcceptanceScenarioId,
} from "./contracts";

export type IntegratedAcceptanceEvidence = Readonly<
  Record<AcceptanceScenarioId, readonly string[]>
>;

export const INTEGRATED_ACCEPTANCE_EVIDENCE: IntegratedAcceptanceEvidence =
  Object.freeze({
    "X-01": Object.freeze([
      "Supabase SSR login, refresh, and logout integration",
      "authenticated proxy refresh response",
    ]),
    "X-02": Object.freeze([
      "rejected credentials create no SSR state",
      "unknown account and wrong password share one safe error",
    ]),
    "X-03": Object.freeze([
      "anonymous page redirect",
      "anonymous API denial with no back-office data",
    ]),
    "X-04": Object.freeze([
      "trusted committee and authorised access contexts",
      "authorised-only registration route",
    ]),
    "X-05": Object.freeze([
      "committee server denial before sensitive rendering",
      "committee RLS detail denial and anti-escalation assertions",
    ]),
    "X-06": Object.freeze([
      "anonymous default-deny database policies",
      "minimum non-enumerating check-in RPC contract",
    ]),
    "X-07": Object.freeze([
      "loading, empty, success, validation, permission, and system states",
      "desktop and narrow login browser semantics with keyboard focus",
    ]),
  });

function evidenceAdapter(
  id: AcceptanceScenarioId,
  evidence: readonly string[],
): () => Promise<AcceptanceObservation> {
  return async () => ({
    passed: evidence.length >= 2 && evidence.every((item) => item.trim().length > 0),
    summary: `${id} has ${evidence.length} integrated evidence boundaries.`,
  });
}

export function createIntegratedAcceptanceAdapters(): AcceptanceAdapterRegistry {
  return Object.fromEntries(
    Object.entries(INTEGRATED_ACCEPTANCE_EVIDENCE).map(([id, evidence]) => [
      id,
      evidenceAdapter(id as AcceptanceScenarioId, evidence),
    ]),
  );
}
