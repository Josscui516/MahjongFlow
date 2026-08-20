import type { MeetingHistoryItem } from "./contracts";

const FICTIONAL_HISTORY: readonly MeetingHistoryItem[] = [
  {
    id: "00000000-0000-4000-8000-000000000003",
    startsAt: "2026-08-12T10:30:00.000Z",
    summary: "Updated room plan and confirmed the equipment checklist.",
    title: "Weekly planning recap (updated)",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    startsAt: "2026-08-05T10:30:00.000Z",
    summary: "Reviewed fictional event preparation tasks.",
    title: "Event preparation review",
  },
  {
    id: "00000000-0000-4000-8000-000000000001",
    startsAt: "2026-08-05T10:30:00.000Z",
    summary: null,
    title: "Committee workflow check",
  },
];

export function createMeetingHistoryFixture(): readonly MeetingHistoryItem[] {
  return FICTIONAL_HISTORY.map((item) => ({ ...item }));
}
