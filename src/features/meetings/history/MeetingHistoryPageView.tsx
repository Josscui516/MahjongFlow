import Link from "next/link";

import {
  PermissionDeniedFeedback,
  SystemErrorFeedback,
} from "@/components/feedback";
import { PageFrame } from "@/components/layout";

import type {
  MeetingHistoryCriteria,
  MeetingHistoryPageResult,
} from "./contracts";
import { MeetingHistoryList } from "./MeetingHistoryList";

export const MEETING_HISTORY_DESCRIPTION =
  "Find, review, and reopen committee meeting records.";

export function MeetingHistoryPageHeader() {
  return (
    <header className="flex flex-col gap-6 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          Meetings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {MEETING_HISTORY_DESCRIPTION}
        </p>
      </div>

      <Link
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:self-auto"
        href="/meetings/new"
      >
        <svg
          aria-hidden="true"
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
        Create meeting
      </Link>
    </header>
  );
}

export function MeetingHistoryPageView({
  criteria,
  result,
}: Readonly<{
  criteria: MeetingHistoryCriteria;
  result: MeetingHistoryPageResult;
}>) {
  return (
    <div className="space-y-6">
      <MeetingHistoryPageHeader />
      <section aria-label="Meeting history content" className="min-w-0">
        <MeetingHistoryList criteria={criteria} result={result} />
      </section>
    </div>
  );
}

export function MeetingHistoryPermissionDeniedView() {
  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      feedbackSlot={
        <PermissionDeniedFeedback
          backAction={
            <Link
              className="font-semibold underline underline-offset-4"
              href="/backoffice"
            >
              Return to the back office
            </Link>
          }
        />
      }
      title="Meetings"
    >
      <p className="text-sm text-slate-600">
        No meeting information has been displayed.
      </p>
    </PageFrame>
  );
}

export function MeetingHistorySystemErrorView({
  action,
}: Readonly<{ action?: React.ReactNode }>) {
  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      feedbackSlot={
        <SystemErrorFeedback
          action={
            action ?? (
              <a
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
                href=""
              >
                Try again
              </a>
            )
          }
        />
      }
      title="Meetings"
    >
      <p className="text-sm text-slate-600">
        No meeting information has been displayed.
      </p>
    </PageFrame>
  );
}
