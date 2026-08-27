import Link from "next/link";

import type { SourceTraceabilityResult } from "./contracts";
import {
  SourceNavigationEmpty,
  SourceNavigationLoading,
  SourceNavigationSystemError,
  SourceNavigationUnavailable,
} from "./NavigationFeedback";
import { getMeetingHref, getSourceKindLabel } from "./presentation";

export type SourceTraceabilityPanelProps = Readonly<{
  result: SourceTraceabilityResult;
}>;

export function SourceTraceabilityPanelLoading() {
  return <SourceNavigationLoading subject="source details" />;
}

export function SourceTraceabilityPanel({ result }: SourceTraceabilityPanelProps) {
  if (!result.ok) {
    return result.code === "UNAVAILABLE" ? (
      <SourceNavigationUnavailable />
    ) : (
      <SourceNavigationSystemError />
    );
  }

  if (!result.source) {
    return <SourceNavigationEmpty subject="source details" />;
  }

  const source = result.source;

  return (
    <aside
      aria-labelledby="task-source-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      data-source-navigation-state="success"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
        {getSourceKindLabel(source.sourceKind)}
      </p>
      <h2 className="mt-2 text-lg font-semibold text-slate-950" id="task-source-heading">
        Source meeting
      </h2>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {source.meetingTitle}
      </p>
      <blockquote className="mt-4 break-words rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950/80 ring-1 ring-inset ring-emerald-100">
        {source.sourceContent}
      </blockquote>
      <Link
        aria-label={`Return to source meeting ${source.meetingTitle}`}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        href={getMeetingHref(source.meetingId)}
      >
        Return to source meeting
      </Link>
    </aside>
  );
}
