import Link from "next/link";
import { PRIMARY_ROUTE_ACTION_CLASS } from "./RouteState";
import { useId, type ReactNode } from "react";

type FeedbackState = "empty" | "error" | "loading" | "permission" | "success";

type FeedbackPanelProps = Readonly<{
  action?: ReactNode;
  busy?: boolean;
  description: string;
  live: "assertive" | "polite";
  role: "alert" | "status";
  state: FeedbackState;
  title: string;
}>;

const STATE_STYLES: Readonly<Record<FeedbackState, string>> = {
  empty: "bg-slate-100 text-slate-700 ring-slate-200",
  error: "bg-rose-50 text-rose-700 ring-rose-200",
  loading: "bg-sky-50 text-sky-700 ring-sky-200",
  permission: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function StateIcon({ state }: Readonly<{ state: FeedbackState }>) {
  if (state === "loading") {
    return (
      <span className="relative grid size-4 place-items-center">
        <span className="absolute size-4 rounded-full bg-current opacity-20 motion-safe:animate-ping" />
        <span className="relative size-2 rounded-full bg-current" />
      </span>
    );
  }

  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24">
      {state === "success" ? (
        <path
          d="m7 12 3 3 7-7"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      ) : state === "empty" ? (
        <path
          d="M5 8h14M7 12h10M9 16h6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      ) : (
        <path
          d="M12 8v4m0 4h.01M10.3 4.8 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

function FeedbackPanel({
  action,
  busy,
  description,
  live,
  role,
  state,
  title,
}: FeedbackPanelProps) {
  const titleId = useId();

  return (
    <section
      aria-busy={busy || undefined}
      aria-labelledby={titleId}
      aria-live={live}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm sm:p-6"
      data-feedback-state={state}
      role={role}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${STATE_STYLES[state]}`}
        >
          <StateIcon state={state} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-950" id={titleId}>
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
            {description}
          </p>
          {action ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              {action}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export type LoadingFeedbackProps = Readonly<{
  description?: string;
  title?: string;
}>;

export function LoadingFeedback({
  description = "The latest information is being prepared. Please wait.",
  title = "Loading",
}: LoadingFeedbackProps) {
  return (
    <FeedbackPanel
      busy
      description={description}
      live="polite"
      role="status"
      state="loading"
      title={title}
    />
  );
}

export type EmptyFeedbackProps = Readonly<{
  action?: ReactNode;
  description?: string;
  title?: string;
}>;

export function EmptyFeedback({
  action,
  description = "There is nothing to show here yet.",
  title = "No results",
}: EmptyFeedbackProps) {
  return (
    <FeedbackPanel
      action={action}
      description={description}
      live="polite"
      role="status"
      state="empty"
      title={title}
    />
  );
}

export type SuccessFeedbackProps = Readonly<{
  action?: ReactNode;
  message: string;
  title?: string;
}>;

export function SuccessFeedback({
  action,
  message,
  title = "Changes saved",
}: SuccessFeedbackProps) {
  return (
    <FeedbackPanel
      action={action}
      description={message}
      live="polite"
      role="status"
      state="success"
      title={title}
    />
  );
}

export type SystemErrorFeedbackProps = Readonly<{
  action?: ReactNode;
}>;

/** Does not accept raw provider errors, so internal details cannot be echoed. */
export function SystemErrorFeedback({ action }: SystemErrorFeedbackProps) {
  return (
    <FeedbackPanel
      action={action}
      description="We could not complete the request. Try again, and contact the committee if the problem continues."
      live="assertive"
      role="alert"
      state="error"
      title="Something went wrong"
    />
  );
}

export type PermissionDeniedFeedbackProps = Readonly<{
  backAction?: ReactNode;
}>;

/** Uses fixed copy and never renders resource details or protected children. */
export function PermissionDeniedFeedback({
  backAction,
}: PermissionDeniedFeedbackProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <section
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-950 sm:p-10"
      data-feedback-state="permission"
      role="alert"
    >
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-xl bg-slate-100 text-slate-600">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
        </svg>
      </span>
      <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl" id={titleId}>
        You cannot access this page
      </h2>
      <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:text-base" id={descriptionId}>
        This page is not available to your account. Return to a page you can access or contact the committee if you need help.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        {backAction ?? <Link className={PRIMARY_ROUTE_ACTION_CLASS} href="/backoffice">Return to workspace</Link>}
      </div>
    </section>
  );
}
