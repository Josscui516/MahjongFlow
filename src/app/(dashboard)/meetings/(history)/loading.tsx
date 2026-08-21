import { RouteLoadingStatus } from "@/components/feedback";
import { MeetingHistoryPageHeader } from "@/features/meetings/history";

const HISTORY_PLACEHOLDERS = ["newest", "earlier"] as const;

function MeetingHistoryCardSkeleton() {
  return (
    <article className="grid min-h-28 gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:items-center sm:px-6">
      <div className="min-w-0 motion-safe:animate-pulse">
        <div className="h-5 w-3/5 max-w-sm rounded-md bg-slate-200" />
        <div className="mt-3 h-3 w-full max-w-lg rounded-full bg-slate-100" />
        <div className="mt-2 h-3 w-4/5 max-w-md rounded-full bg-slate-100" />
      </div>
      <div className="h-3 w-28 rounded-full bg-emerald-100 motion-safe:animate-pulse" />
      <div className="h-4 w-24 rounded-full bg-emerald-100 motion-safe:animate-pulse" />
    </article>
  );
}

export default function MeetingHistoryLoading() {
  return (
    <div className="space-y-6">
      <MeetingHistoryPageHeader />
      <section
        aria-busy="true"
        aria-live="polite"
        className="space-y-3"
        data-feedback-state="loading"
        data-loading-pattern="meeting-timeline"
        role="status"
      >
        <RouteLoadingStatus
          description="applying your current search and filters."
          title="Loading meetings"
        />

        <ol
          aria-hidden="true"
          className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          {HISTORY_PLACEHOLDERS.map((placeholder) => (
            <li key={placeholder}>
              <MeetingHistoryCardSkeleton />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
