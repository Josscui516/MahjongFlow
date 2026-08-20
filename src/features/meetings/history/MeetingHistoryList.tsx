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
    <div className="space-y-4" data-history-state="success">
      <p className="text-sm text-slate-600" role="status">
        {orderedItems.length} {orderedItems.length === 1 ? "meeting" : "meetings"}
        {" available, newest first."}
      </p>

      <ol className="grid gap-4">
        {orderedItems.map((item, index) => {
          const headingId = `meeting-history-item-${index}`;

          return (
            <li key={item.id}>
              <article
                aria-labelledby={headingId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-800">
                      <time dateTime={item.startsAt}>
                        {formatMeetingStart(item.startsAt)}
                      </time>
                    </p>
                    <h2
                      className="mt-1 text-lg font-semibold text-slate-950"
                      id={headingId}
                    >
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.summary ?? "No summary has been recorded."}
                    </p>
                  </div>

                  <Link
                    className="shrink-0 rounded-lg border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    href={getMeetingDetailsHref(item.id)}
                  >
                    Open details for {item.title}
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
