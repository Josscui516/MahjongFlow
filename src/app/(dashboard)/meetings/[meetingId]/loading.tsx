import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import {
  MeetingLoadingSkeleton,
  MeetingStatePanel,
} from "@/features/meetings/editor/MeetingStatePanel";

export default function MeetingDetailLoading() {
  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Loading the latest committee-safe meeting record."
        title="Meeting details"
      />
      <MeetingStatePanel
        description="Please wait while the latest meeting details are retrieved."
        state="loading"
        title="Loading meeting…"
      />
      <MeetingLoadingSkeleton />
    </div>
  );
}
