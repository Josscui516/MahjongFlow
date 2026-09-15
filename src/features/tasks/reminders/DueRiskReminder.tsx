import Link from "next/link";

import type { DueRiskResult } from "../due-risk";

export type DueRiskReminderProps = Readonly<{
  risk: DueRiskResult;
  taskTitle: string;
  /** Pass the same protected task-detail link used by the host. */
  taskHref?: `/tasks/${string}`;
}>;

const presentations = {
  overdue: {
    label: "Overdue",
    detail: "Past its due date (Sydney time).",
    style: "border-red-300 bg-red-50 text-red-900",
  },
  dueSoon: {
    label: "Due soon",
    detail: "Due today or within 7 days (Sydney time).",
    style: "border-amber-300 bg-amber-50 text-amber-900",
  },
  invalid: {
    label: "Due status unavailable",
    detail: "The task's due status could not be determined.",
    style: "border-slate-300 bg-slate-50 text-slate-900",
  },
} as const;

/** Pure presentation: the host owns classification, authorisation and refresh. */
export function DueRiskReminder({ risk, taskTitle, taskHref }: DueRiskReminderProps) {
  const state = risk.ok ? risk.value : "invalid";
  if (state === "normal" || state === "completed") {
    return null;
  }

  const presentation = presentations[state];
  // Never turn a mistaken external/missing-source link into an active control.
  const safeHref = taskHref && /^\/tasks\/[^/?#\s\\]+$/.test(taskHref)
    ? taskHref
    : undefined;

  return (
    <span
      className={`flex min-w-0 max-w-full items-start gap-2 rounded-md border p-3 text-sm ${presentation.style}`}
      data-due-risk={state}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="mt-0.5 h-5 w-5 shrink-0"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {state === "overdue" ? (
          <><path d="m12 3 10 18H2Z" /><path d="M12 9v5m0 3h.01" /></>
        ) : state === "dueSoon" ? (
          <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>
        ) : (
          <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M12 11v5" /></>
        )}
      </svg>
      <span className="min-w-0 [overflow-wrap:anywhere]">
        <span className="block font-semibold">{presentation.label}</span>
        <span className="block">{presentation.detail}</span>
        {safeHref ? (
          <Link
            href={safeHref}
            prefetch={false}
            className="mt-1 inline-block max-w-full rounded-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            Open task: {taskTitle} — {presentation.label}
          </Link>
        ) : (
          <span className="mt-1 block">Task: {taskTitle}</span>
        )}
      </span>
    </span>
  );
}
