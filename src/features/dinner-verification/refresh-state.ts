import type { DinnerVerificationResult } from "./contracts";

export type VerificationState = Readonly<{
  request: number;
  result: DinnerVerificationResult;
  pending: boolean;
  stale: boolean;
  refreshFailed: boolean;
}>;
type Action =
  | { type: "start"; request: number }
  | { type: "finish"; request: number; result: DinnerVerificationResult }
  | { type: "stale" };

export function initialVerificationState(result: DinnerVerificationResult): VerificationState {
  return { request: 0, result, pending: false, stale: false, refreshFailed: false };
}

export function verificationReducer(state: VerificationState, action: Action): VerificationState {
  if (action.type === "stale") return { ...state, stale: true };
  if (action.type === "start") return { ...state, request: action.request, pending: true, stale: true, refreshFailed: false };
  // An older request must never overwrite a newer correction/verification.
  if (action.request !== state.request) return state;
  if (!action.result.ok && action.result.code === "SYSTEM_ERROR" && state.result.ok) {
    return { ...state, pending: false, stale: true, refreshFailed: true };
  }
  // Permission/session loss clears even the previously rendered identities.
  return { ...state, result: action.result, pending: false, stale: false, refreshFailed: false };
}
