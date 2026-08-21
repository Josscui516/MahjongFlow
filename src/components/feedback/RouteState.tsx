import { useId, type ReactNode } from "react";

export const PRIMARY_ROUTE_ACTION_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2";

export const SECONDARY_ROUTE_ACTION_CLASS =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2";

export function RouteLoadingStatus({
  description,
  title,
}: Readonly<{
  description: string;
  title: string;
}>) {
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-3 text-sm text-slate-600"
      data-route-loading-status="true"
      role="status"
    >
      <span
        aria-hidden="true"
        className="relative mt-1 grid size-3 shrink-0 place-items-center"
      >
        <span className="absolute size-3 rounded-full bg-emerald-300 motion-safe:animate-ping" />
        <span className="relative size-2 rounded-full bg-emerald-700" />
      </span>
      <p className="min-w-0">
        <span className="font-semibold text-slate-800">{title}</span>
        <span className="hidden sm:inline"> — {description}</span>
      </p>
    </div>
  );
}

export function SecureRouteLoading({
  description,
  title,
}: Readonly<{
  description: string;
  title: string;
}>) {
  return (
    <main
      className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950"
      data-feedback-state="loading"
    >
      <section className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="bg-emerald-950 px-6 py-6 text-white sm:px-8">
          <p className="text-xl font-bold tracking-tight">MahjongFlow</p>
          <p className="mt-1 text-sm text-emerald-100">
            Committee coordination
          </p>
        </div>

        <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
          <header>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </header>

          <div aria-busy="true" className="space-y-5">
            <RouteLoadingStatus
              description="checking the latest secure session and access context."
              title="Please wait"
            />
            <div
              aria-hidden="true"
              className="space-y-4 motion-safe:animate-pulse"
            >
              <div className="h-12 rounded-xl bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-100" />
              <div className="h-11 w-36 rounded-xl bg-emerald-100" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export type RouteErrorFeedbackProps = Readonly<{
  actions: ReactNode;
  description: string;
  note?: string;
  pattern?: string;
  recoveryItems?: readonly [string, string];
  title: string;
}>;

/**
 * Shared route-boundary presentation. The component intentionally accepts only
 * safe display copy, never the raw Error supplied by Next.js.
 */
export function RouteErrorFeedback({
  actions,
  description,
  note = "No confirmed changes were made.",
  pattern = "route-recovery",
  recoveryItems = [
    "Retry the request",
    "Return to a stable page if the problem continues",
  ],
  title,
}: RouteErrorFeedbackProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-error-pattern={pattern}
      data-feedback-state="error"
      role="alert"
    >
      <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4 sm:gap-5">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200"
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
              <h2
                className="max-w-2xl text-xl font-bold tracking-tight text-slate-950 sm:text-2xl"
                id={titleId}
              >
                {title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {description}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {actions}
              </div>
            </div>
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-slate-50/80 p-6 lg:border-l lg:border-t-0 lg:p-8">
          <h3 className="text-sm font-semibold text-slate-900">
            Recovery options
          </h3>
          <ol className="mt-5 space-y-5">
            {recoveryItems.map((item, index) => (
              <li className="flex gap-3" key={item}>
                <span
                  aria-hidden="true"
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-emerald-900 ring-1 ring-inset ring-slate-300"
                >
                  {index + 1}
                </span>
                <span className="text-sm leading-6 text-slate-600">{item}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {note ? (
        <div className="border-t border-slate-200 bg-white px-6 py-3 text-sm text-slate-600 sm:px-8">
          {note}
        </div>
      ) : null}
    </section>
  );
}
