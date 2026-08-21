import Link from "next/link";

import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import { MeetingRouteErrorPanel } from "@/features/meetings/editor/MeetingStatePanel";

export default function MeetingNotFound() {
  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Review the recorded committee-safe summary and update the meeting when needed."
        title="Meeting details"
      />
      <MeetingRouteErrorPanel
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            href="/meetings"
          >
            Back to meetings
          </Link>
        }
        description="This meeting may have moved or no longer exists. Return to meeting history to choose an available record."
        kind="not-found"
        title="Meeting not found"
      />
    </div>
  );
}
