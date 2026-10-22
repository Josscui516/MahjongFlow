import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import {
  MeetingEditorLoadingSkeleton,
  MeetingLoadingStatus,
} from "@/features/meetings/editor/MeetingStatePanel";

export default function NewMeetingLoading() {
  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Enter the meeting details, then add discussion points and decisions."
        title="Create meeting"
      />
      <div className="space-y-4" data-feedback-state="loading">
        <MeetingLoadingStatus
          description="preparing committee profiles and form controls."
          title="Preparing the meeting editor"
        />
        <MeetingEditorLoadingSkeleton mode="create" />
      </div>
    </div>
  );
}
