import { MeetingHistorySort } from "./MeetingHistorySort";
import Link from "next/link";
import { MeetingHistoryFilters } from "./MeetingHistoryFilters";

import { EmptyFeedback } from "@/components/feedback";
import { MeetingDeleteButton } from "@/features/meetings/MeetingDeleteButton";

import type {
  MeetingHistoryCriteria,
  MeetingHistoryPageResult,
} from "./contracts";
import {
  buildMeetingHistoryHref,
  hasMeetingHistoryFilters,
} from "./search-params";
import { sortMeetingHistoryItems } from "./projection";
import { MeetingCreateLabel } from "./MeetingCreateLabel";

export type MeetingHistoryListProps = Readonly<{
  criteria: MeetingHistoryCriteria;
  result: MeetingHistoryPageResult;
}>;

const SYDNEY_MEETING_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Australia/Sydney",
});


export function formatMeetingStart(startsAt: string) {
  return SYDNEY_MEETING_FORMATTER.format(new Date(startsAt));
}

export function getMeetingDetailsHref(meetingId: string) {
  return `/meetings/${encodeURIComponent(meetingId)}`;
}


function MeetingHistoryPagination({
  criteria,
  result,
}: MeetingHistoryListProps) {
  if (result.pageCount <= 1) return null;

  const linkClass =
    "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-slate-50 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700";

  return (
    <nav
      aria-label="Meetings pagination"
      className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-slate-600">
        Page <span className="font-semibold text-slate-900">{result.page}</span> of{" "}
        <span className="font-semibold text-slate-900">{result.pageCount}</span>
      </p>
      <div className="flex gap-2">
        {result.page > 1 ? (
          <Link
            className={linkClass}
            href={buildMeetingHistoryHref(criteria, result.page - 1)}
            rel="prev"
          >
            Previous
          </Link>
        ) : null}
        {result.page < result.pageCount ? (
          <Link
            className={linkClass}
            href={buildMeetingHistoryHref(criteria, result.page + 1)}
            rel="next"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function MeetingHistoryList({
  criteria,
  result,
}: MeetingHistoryListProps) {
  const hasFilters = hasMeetingHistoryFilters(criteria);
  const orderedItems = sortMeetingHistoryItems(result.items, criteria.sort);
  const rangeStart = (result.page - 1) * result.pageSize + 1;
  const rangeEnd = Math.min(result.page * result.pageSize, result.totalCount);
  const currentHistoryHref = buildMeetingHistoryHref(criteria);
  const deleteSuccessHref = `${currentHistoryHref}${currentHistoryHref.includes("?") ? "&" : "?"}deleted=1`;

  return (
    <div className="space-y-5" data-history-state="success">
      {result.totalCount > 0 || hasFilters ? (
        <MeetingHistoryFilters criteria={criteria} />
      ) : null}

      {result.totalCount > 0 || hasFilters ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800" role="status">
              Showing {orderedItems.length ? rangeStart : 0}–{orderedItems.length ? rangeEnd : 0} of {result.totalCount}{" "}
              {result.totalCount === 1 ? "meeting" : "meetings"}
            </p>
            <MeetingHistorySort criteria={criteria} />
          </div>
      ) : null}

      {orderedItems.length === 0 ? (
        <EmptyFeedback
          action={
            hasFilters ? (
              <Link
                className="font-semibold underline underline-offset-4"
                href="/meetings"
              >
                Clear search and filters
              </Link>
            ) : (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                href="/meetings/new"
              >
                <MeetingCreateLabel>Create your first meeting</MeetingCreateLabel>
              </Link>
            )
          }
          description={
            hasFilters
              ? "Try a different meeting title or date range, or clear your filters to see all meetings."
              : "Record your committee’s discussions and decisions, then turn follow-up actions into tasks."
          }
          title={hasFilters ? "No matching meetings" : "No meetings recorded"}
        />
      ) : (
        <>


          <ol className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {orderedItems.map((item) => {
              const headingId = `meeting-history-item-${item.id}`;

              return (
                <li key={item.id}>
                  <article
                    aria-labelledby={headingId}
                    className="grid min-h-28 gap-4 p-5 transition-colors hover:bg-emerald-50/50 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-center sm:px-6"
                  >
                    <Link
                      className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
                      href={getMeetingDetailsHref(item.id)}
                    >
                      <h2 className="text-lg font-semibold text-slate-950" id={headingId}>
                        {item.title}
                      </h2>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">
                        {item.summary ?? "No summary has been recorded."}
                      </p>
                    </Link>

                    <p className="text-sm font-semibold text-emerald-800">
                      <time dateTime={item.startsAt}>
                        {formatMeetingStart(item.startsAt)}
                      </time>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <Link
                        className="inline-flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        href={getMeetingDetailsHref(item.id)}
                      >
                        Open meeting
                      </Link>
                      <MeetingDeleteButton
                        meetingId={item.id}
                        meetingTitle={item.title}
                        successHref={deleteSuccessHref}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

          <MeetingHistoryPagination criteria={criteria} result={result} />
        </>
      )}
    </div>
  );
}
