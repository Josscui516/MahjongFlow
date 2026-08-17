import { LoadingFeedback } from "@/components/feedback";
import { PageFrame } from "@/components/layout";
import { MEETING_HISTORY_DESCRIPTION } from "@/features/meetings/history";

export default function MeetingHistoryLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
      <PageFrame
        description={MEETING_HISTORY_DESCRIPTION}
        feedbackSlot={
          <LoadingFeedback
            description="The latest meeting records are being prepared."
            title="Loading meeting history"
          />
        }
        title="Meeting history"
      >
        <div aria-hidden="true" className="grid gap-4">
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </PageFrame>
    </main>
  );
}
