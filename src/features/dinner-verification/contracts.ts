import type { DinnerEligibility } from "./dinner-eligibility";

export type DinnerFailure = Readonly<{
  ok: false;
  code: "PERMISSION_DENIED" | "UNAUTHENTICATED" | "SYSTEM_ERROR" | "UNAVAILABLE" | "VALIDATION";
}>;

// Minimal roster identity and current eligibility; participantId is the roster entry ID.
export type DinnerVerificationItem = Readonly<{
  participantId: string;
  participantName: string;
  participantEmail: string;
  eligibility: DinnerEligibility;
}>;

export type DinnerVerificationResult = DinnerFailure | Readonly<{
  ok: true;
  event: Readonly<{ id: string; name: string }>;
  items: readonly DinnerVerificationItem[];
  eligibleCount: number;
  readAt: string;
}>;
