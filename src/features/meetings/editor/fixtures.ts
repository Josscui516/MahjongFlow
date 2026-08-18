import type { MeetingRecordDTO } from "./contracts";

export const FICTIONAL_COMMITTEE_OPTIONS = [
  { id: "fictional-alex", label: "Alex Example" },
  { id: "fictional-blair", label: "Blair Example" },
  { id: "fictional-casey", label: "Casey Example" },
  { id: "fictional-drew", label: "Drew Example" },
] as const;

export const FICTIONAL_MEETING: MeetingRecordDTO = {
  attendeeIds: ["fictional-alex", "fictional-blair"],
  decisions: "Proceed with the agreed implementation checkpoint.",
  discussionPoints: "Review the current sprint status and immediate blockers.",
  id: "fixture-weekly-committee",
  startsAt: "2026-08-18T18:30",
  summary:
    "The committee reviewed delivery progress and confirmed the next implementation checkpoint.",
  title: "Weekly committee meeting",
};

export function getFictionalMeeting(
  meetingId: string,
): MeetingRecordDTO | null {
  return meetingId === FICTIONAL_MEETING.id ? FICTIONAL_MEETING : null;
}
