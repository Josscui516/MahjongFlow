import type { DinnerVerificationItem } from "./contracts";

/** Count marked people in the current confirmed-attendance list. */
export function countDinnerEligibility(items: readonly DinnerVerificationItem[]): number {
  return items.filter(item => Boolean(item.issuedAt)).length;
}
