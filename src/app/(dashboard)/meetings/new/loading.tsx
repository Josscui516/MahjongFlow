import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import {
  MeetingLoadingSkeleton,
  MeetingStatePanel,
} from "@/features/meetings/editor/MeetingStatePanel";

export default function NewMeetingLoading() {
  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Preparing the meeting editor."
        title="Create meeting"
      />
      <MeetingStatePanel
        description="Please wait while the editor is prepared."
        state="loading"
        title="Loading meeting editor…"
      />
      <MeetingLoadingSkeleton />
    </div>
  );
}
