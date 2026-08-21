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
      className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"
      data-feedback-state="error"
      role="alert"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24">
            <path
              d="M12 8v4m0 4h.01M10.3 4.8 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold" id={titleId}>
            {copy.title}
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {copy.message}
          </p>
        </div>
      </div>
    </section>
  );
}
