import type { MeetingInput, MeetingValidationError } from "@/features/meetings/schemas";

export type MeetingRecordDTO = Readonly<{
  attendeeIds: readonly string[]; createdAt: string; createdBy: string; id: string;
  startsAt: string; summary: string; title: string; updatedAt: string;
}>;
export type MeetingHistoryItem = Readonly<{ id: string; startsAt: string; summary: string; title: string }>;
export type MeetingMutationResult =
  | Readonly<{ ok: true; record: MeetingRecordDTO }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR" | "VALIDATION"; errors?: readonly MeetingValidationError[]; ok: false }>;
export type MeetingReadResult =
  | Readonly<{ ok: true; record: MeetingRecordDTO }>
  | Readonly<{ code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;
export type MeetingHistoryResult =
  | Readonly<{ items: readonly MeetingHistoryItem[]; ok: true }>
  | Readonly<{ code: "PERMISSION_DENIED" | "SYSTEM_ERROR"; ok: false }>;
export type MeetingEditorPort = Readonly<{
  createMeeting: (input: MeetingInput) => Promise<MeetingMutationResult>;
  getMeeting: (meetingId: string) => Promise<MeetingReadResult>;
  updateMeeting: (meetingId: string, input: MeetingInput) => Promise<MeetingMutationResult>;
}>;
