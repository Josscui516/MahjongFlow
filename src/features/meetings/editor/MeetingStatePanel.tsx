import type { ReactNode } from "react";

const STATE_STYLES = {
  duplicate: "bg-amber-50 text-amber-800 ring-amber-200",
  loading: "bg-sky-50 text-sky-800 ring-sky-200",
  permission: "bg-amber-50 text-amber-800 ring-amber-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  system: "bg-rose-50 text-rose-800 ring-rose-200",
} as const;

const ROUTE_STATE_STYLES = {
  "not-found": {
    icon: "bg-slate-100 text-slate-700 ring-slate-200",
    surface: "bg-slate-50/80",
  },
  system: {
    icon: "bg-rose-50 text-rose-700 ring-rose-200",
    surface: "bg-rose-50/60",
  },
} as const;

export function MeetingStatePanel({
  action,
  description,
  state,
  title,
}: Readonly<{
  action?: ReactNode;
  description: string;
  state: keyof typeof STATE_STYLES;
  title: string;
}>) {
  const isPositive = state === "success";

  return (
    <section
      aria-live={state === "success" || state === "loading" ? "polite" : "assertive"}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm"
      data-meeting-state={state}
      role={state === "success" || state === "loading" ? "status" : "alert"}
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${STATE_STYLES[state]}`}
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24">
            {isPositive ? (
              <path
                d="m7 12 3 3 7-7"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
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
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {description}
          </p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function MeetingLoadingSkeleton() {
  return <MeetingEditorLoadingSkeleton mode="create" />;
}

export function MeetingLoadingStatus({
  description,
  title,
}: Readonly<{ description: string; title: string }>) {
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-3 text-sm text-slate-600"
      data-meeting-loading-status="true"
      role="status"
    >
      <span
        aria-hidden="true"
        className="relative mt-1 grid size-3 shrink-0 place-items-center"
      >
        <span className="absolute size-3 rounded-full bg-emerald-300 motion-safe:animate-ping" />
        <span className="relative size-2 rounded-full bg-emerald-700" />
      </span>
      <p>
        <span className="font-semibold text-slate-800">{title}</span>
        <span className="hidden sm:inline"> — {description}</span>
      </p>
    </div>
  );
}

function SkeletonLine({ className }: Readonly<{ className: string }>) {
  return <div className={`rounded-full bg-slate-200 ${className}`} />;
}

function MeetingFormLoadingSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {["title", "date"].map((field) => (
            <div className="space-y-3" key={field}>
              <SkeletonLine className="h-3 w-28" />
              <SkeletonLine className="h-3 w-48 bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="mt-7 space-y-3">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-3 w-44 bg-slate-100" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {["first", "second"].map((participant) => (
              <div
                className="h-11 rounded-xl border border-slate-200 bg-slate-50"
                key={participant}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-3 w-60 bg-slate-100" />
        <div className="h-36 rounded-xl bg-slate-100" />
      </section>

      <div className="flex justify-end gap-3">
        <div className="h-11 w-20 rounded-xl bg-slate-200" />
        <div className="h-11 w-36 rounded-xl bg-emerald-100" />
      </div>
    </div>
  );
}

function MeetingDetailLoadingSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-5 motion-safe:animate-pulse lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]"
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0 flex-1 space-y-3">
              <SkeletonLine className="h-5 w-2/3 max-w-sm" />
              <SkeletonLine className="h-3 w-56 bg-slate-100" />
            </div>
            <div className="h-11 w-28 rounded-xl bg-emerald-100" />
          </div>
          <div className="mt-6 space-y-2 border-t border-slate-200 pt-5">
            <SkeletonLine className="h-3 w-full bg-slate-100" />
            <SkeletonLine className="h-3 w-4/5 bg-slate-100" />
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <SkeletonLine className="h-5 w-36" />
          <div className="h-24 rounded-xl bg-slate-100" />
          <div className="h-24 rounded-xl bg-slate-100" />
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <SkeletonLine className="h-5 w-32" />
        <SkeletonLine className="h-3 w-full bg-slate-100" />
        <SkeletonLine className="h-3 w-4/5 bg-slate-100" />
        <div className="h-24 rounded-xl bg-slate-100" />
      </aside>
    </div>
  );
}

export function MeetingEditorLoadingSkeleton({
  mode,
}: Readonly<{ mode: "create" | "detail" }>) {
  return mode === "create" ? (
    <MeetingFormLoadingSkeleton />
  ) : (
    <MeetingDetailLoadingSkeleton />
  );
}

export function MeetingRouteErrorPanel({
  action,
  description,
  kind = "system",
  title,
}: Readonly<{
  action: ReactNode;
  description: string;
  kind?: keyof typeof ROUTE_STATE_STYLES;
  title: string;
}>) {
  const styles = ROUTE_STATE_STYLES[kind];

  return (
    <section
      aria-labelledby="meeting-route-error-title"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      data-meeting-route-state={kind}
      role="alert"
    >
      <div className="flex items-start gap-4 p-6 sm:gap-5 sm:p-8">
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${styles.icon}`}
        >
          <svg className="size-5" fill="none" viewBox="0 0 24 24">
            {kind === "not-found" ? (
              <path
                d="M9.5 9.5a3.5 3.5 0 1 1 5 5M12 18h.01"
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
        </span>

        <div className="min-w-0 flex-1">
          <h2
            className="text-xl font-bold tracking-tight text-slate-950"
            id="meeting-route-error-title"
          >
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {action}
          </div>
        </div>
      </div>
      <div className={`border-t border-slate-200 px-6 py-3 text-sm text-slate-600 sm:px-8 ${styles.surface}`}>
        No meeting changes were made.
      </div>
    </section>
  );
}
