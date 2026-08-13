import { useId, type ReactNode } from "react";

type FeedbackState = "empty" | "error" | "loading" | "permission" | "success";

type FeedbackPanelProps = Readonly<{
  action?: ReactNode;
  busy?: boolean;
  description: string;
  eyebrow: string;
  live: "assertive" | "polite";
  role: "alert" | "status";
  state: FeedbackState;
  title: string;
}>;

const STATE_STYLES: Readonly<Record<FeedbackState, string>> = {
  empty: "border-slate-300 bg-white text-slate-900",
  error: "border-rose-300 bg-rose-50 text-rose-950",
  loading: "border-sky-300 bg-sky-50 text-sky-950",
  permission: "border-amber-300 bg-amber-50 text-amber-950",
  success: "border-emerald-300 bg-emerald-50 text-emerald-950",
};

const STATE_MARKS: Readonly<Record<FeedbackState, string>> = {
  empty: "—",
  error: "!",
  loading: "…",
  permission: "!",
  success: "✓",
};

function FeedbackPanel({
  action,
  busy,
  description,
  eyebrow,
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
      className={`rounded-2xl border p-4 sm:p-5 ${STATE_STYLES[state]}`}
      data-feedback-state={state}
      role={role}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full border border-current text-sm font-bold"
        >
          {STATE_MARKS[state]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em]">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-base font-semibold" id={titleId}>
            {title}
          </h2>
          <p className="mt-1 text-sm leading-6 opacity-85">{description}</p>
          {action ? <div className="mt-4">{action}</div> : null}
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
      eyebrow="In progress"
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
      eyebrow="Empty"
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
      eyebrow="Success"
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
      eyebrow="System error"
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
  return (
    <FeedbackPanel
      action={backAction}
      description="This page is not available to your account. Return to a page you can access or contact the committee if you need help."
      eyebrow="Permission denied"
      live="assertive"
      role="alert"
      state="permission"
      title="You cannot access this page"
    />
  );
}
