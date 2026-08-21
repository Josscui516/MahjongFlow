import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import {
  MeetingEditorLoadingSkeleton,
  MeetingLoadingStatus,
} from "@/features/meetings/editor/MeetingStatePanel";

export default function MeetingDetailLoading() {
  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Loading the latest committee-safe meeting record."
        title="Meeting details"
      />
      <div className="space-y-4" data-feedback-state="loading">
        <MeetingLoadingStatus
          description="retrieving the summary, agenda and linked information."
          title="Loading meeting details"
        />
        <MeetingEditorLoadingSkeleton mode="detail" />
      </div>
    </div>
  );
}
