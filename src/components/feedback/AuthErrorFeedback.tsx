import { useId } from "react";

export type SafeAuthErrorCopy = Readonly<{
  message: string;
  title: string;
}>;

const GENERIC_AUTH_ERROR: SafeAuthErrorCopy = {
  message: "We could not sign you in. Try again shortly.",
  title: "Sign in failed",
};

/**
 * Maps the frozen string values without becoming a second auth contract.
 * The route adapter should consume the canonical #45 type once it is merged.
 * Unknown values and raw errors stay generic.
 */
export function getSafeAuthErrorCopy(code: unknown): SafeAuthErrorCopy {
  switch (code) {
    case "AUTH_INVALID_CREDENTIALS":
      return {
        message: "Check your sign-in details and try again.",
        title: "Sign in failed",
      };
    case "AUTH_INVALID_SESSION":
      return {
        message: "Your session is no longer valid. Sign in again to continue.",
        title: "Sign in again",
      };
    case "AUTH_SERVICE_UNAVAILABLE":
      return {
        message: "Sign in is temporarily unavailable. Try again shortly.",
        title: "Sign in unavailable",
      };
    default:
      return GENERIC_AUTH_ERROR;
  }
}

export type AuthErrorFeedbackProps = Readonly<{
  code: unknown;
}>;

export function AuthErrorFeedback({ code }: AuthErrorFeedbackProps) {
  const titleId = useId();
  const copy = getSafeAuthErrorCopy(code);

  return (
    <section
      aria-labelledby={titleId}
      aria-live="assertive"
      className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950"
      data-feedback-state="error"
      role="alert"
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em]">
        Authentication error
      </p>
      <h2 className="mt-1 font-semibold" id={titleId}>
        {copy.title}
      </h2>
      <p className="mt-1 text-sm leading-6">{copy.message}</p>
    </section>
  );
}
