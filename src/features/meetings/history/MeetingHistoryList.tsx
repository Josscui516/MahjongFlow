import Link from "next/link";

import { EmptyFeedback } from "@/components/feedback";

import type { MeetingHistoryItem } from "./contracts";
import { sortMeetingHistoryItems } from "./projection";

export type MeetingHistoryListProps = Readonly<{
  items: readonly MeetingHistoryItem[];
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

export function MeetingHistoryList({ items }: MeetingHistoryListProps) {
  const orderedItems = sortMeetingHistoryItems(items);

  if (orderedItems.length === 0) {
    return (
      <EmptyFeedback
        description="Create a meeting when the committee is ready to record its first discussion."
        title="No meetings recorded"
      />
    );
  }

  return (
    <div className="space-y-3" data-history-state="success">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-800" role="status">
          {orderedItems.length}{" "}
          {orderedItems.length === 1 ? "meeting" : "meetings"}
        </p>
        <p className="text-sm text-slate-500">Newest first</p>
      </div>

      <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {orderedItems.map((item, index) => {
          const headingId = `meeting-history-item-${index}`;

          return (
            <li key={item.id}>
              <article aria-labelledby={headingId}>
                <Link
                  className="group grid min-h-28 gap-4 p-5 transition-colors hover:bg-emerald-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:px-6"
                  href={getMeetingDetailsHref(item.id)}
                >
                  <div className="sm:self-start sm:pt-0.5">
                    <p className="text-sm font-semibold text-emerald-800">
                      <time dateTime={item.startsAt}>
                        {formatMeetingStart(item.startsAt)}
                      </time>
                    </p>
                  </div>

                  <div className="min-w-0">
                    <h2
                      className="text-lg font-semibold text-slate-950"
                      id={headingId}
                    >
                      {item.title}
                    </h2>
                    <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600">
                      {item.summary ?? "No summary has been recorded."}
                    </p>
                  </div>

                  <span className="inline-flex min-h-10 items-center gap-2 self-start text-sm font-semibold text-emerald-900 sm:self-center">
                    View record
                    <svg
                      aria-hidden="true"
                      className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="m9 18 6-6-6-6"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </span>
                </Link>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
