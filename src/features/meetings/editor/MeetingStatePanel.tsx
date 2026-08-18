import type { ReactNode } from "react";

const STATE_STYLES = {
  duplicate: "border-amber-300 bg-amber-50 text-amber-950",
  loading: "border-sky-300 bg-sky-50 text-sky-950",
  permission: "border-amber-300 bg-amber-50 text-amber-950",
  success: "border-emerald-300 bg-emerald-50 text-emerald-950",
  system: "border-rose-300 bg-rose-50 text-rose-950",
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
  return (
    <section
      aria-live={state === "success" || state === "loading" ? "polite" : "assertive"}
      className={`rounded-2xl border p-5 ${STATE_STYLES[state]}`}
      data-meeting-state={state}
      role={state === "success" || state === "loading" ? "status" : "alert"}
    >
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}

export function MeetingLoadingSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-5 lg:grid-cols-2">
      {["detail", "form"].map((key) => (
        <div
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
          key={key}
        >
          <div className="h-4 w-44 rounded bg-slate-200" />
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-24 rounded-xl bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
