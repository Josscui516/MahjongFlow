import Link from "next/link";

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

export type MeetingHistoryListProps = Readonly<{
  criteria: MeetingHistoryCriteria;
  result: MeetingHistoryPageResult;
}>;

const SYDNEY_MEETING_FORMATTER = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Australia/Sydney",
});

const CONTROL_CLASS =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200";

export function formatMeetingStart(startsAt: string) {
  return SYDNEY_MEETING_FORMATTER.format(new Date(startsAt));
}

export function getMeetingDetailsHref(meetingId: string) {
  return `/meetings/${encodeURIComponent(meetingId)}`;
}

function MeetingHistoryFilters({
  criteria,
}: Readonly<{ criteria: MeetingHistoryCriteria }>) {
  const hasFilters = hasMeetingHistoryFilters(criteria);

  return (
    <form
      action="/meetings"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      method="get"
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto] lg:items-end">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
          Search by title
          <input
            className={CONTROL_CLASS}
            defaultValue={criteria.search}
            maxLength={100}
            name="q"
            placeholder="e.g. Event planning"
            type="search"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
          Time
          <select className={CONTROL_CLASS} defaultValue={criteria.time} name="time">
            <option value="all">All meetings</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">
          Sort
          <select className={CONTROL_CLASS} defaultValue={criteria.sort} name="sort">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>

        <div className="flex min-h-11 items-center gap-2">
          <button
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 lg:flex-none"
            type="submit"
          >
            Apply
          </button>
          {hasFilters ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              href="/meetings"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
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
      <MeetingHistoryFilters criteria={criteria} />

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
            ) : undefined
          }
          description={
            hasFilters
              ? "Try a different title, time range, or sort order."
              : "Create a meeting when the committee is ready to record its first discussion."
          }
          title={hasFilters ? "No matching meetings" : "No meetings recorded"}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-800" role="status">
              Showing {rangeStart}–{rangeEnd} of {result.totalCount}{" "}
              {result.totalCount === 1 ? "meeting" : "meetings"}
            </p>
            <p className="text-sm text-slate-500">
              Sorted by date · {criteria.sort === "newest" ? "newest" : "oldest"} first
            </p>
          </div>

          <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
