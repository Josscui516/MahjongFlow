import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";
import type { DinnerFailure } from "./contracts";

export function DinnerFeedback({ code }: Pick<DinnerFailure, "code">) {
  if (code === "PERMISSION_DENIED") return <PermissionDeniedFeedback />;
  if (code === "UNAUTHENTICATED") return <p role="alert">Your session has ended. <a className="underline" href="/login?next=%2Fdinner-verification">Sign in again</a> to verify dinner eligibility.</p>;
  if (code === "VALIDATION") return <p role="alert">Choose a valid event to verify dinner eligibility.</p>;
  if (code === "UNAVAILABLE") return <p role="alert">This event is unavailable. Choose another event.</p>;
  return <SystemErrorFeedback />;
}
