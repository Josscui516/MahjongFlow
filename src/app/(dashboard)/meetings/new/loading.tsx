import { MeetingPageHeader } from "@/features/meetings/editor/MeetingPageHeader";
import {
  MeetingEditorLoadingSkeleton,
  MeetingLoadingStatus,
} from "@/features/meetings/editor/MeetingStatePanel";

export default function NewMeetingLoading() {
  return (
    <div className="space-y-6">
      <MeetingPageHeader
        description="Record committee-safe meeting details and participants. Add ordered agenda items after the meeting is created."
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
