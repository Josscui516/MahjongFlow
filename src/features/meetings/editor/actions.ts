"use server";

import type { AgendaDraft, AgendaSaveResult } from "@/features/meetings/agenda/contracts";
import { createMeetingAgendaStore } from "@/features/meetings/agenda/persistence";
import { saveMeetingAgenda } from "@/features/meetings/agenda/service";
import type { MeetingMutationResult, MeetingReadResult } from "@/features/meetings/core/contracts";
import { createMeeting, getMeeting, updateMeeting } from "@/features/meetings/core/service";
import type { MeetingInput } from "@/features/meetings/schemas";

export async function createMeetingAction(input: MeetingInput): Promise<MeetingMutationResult> {
  return createMeeting(input);
}

export async function updateMeetingAction(meetingId: string, input: MeetingInput): Promise<MeetingMutationResult> {
  return updateMeeting(meetingId, input);
}

export async function getMeetingAction(meetingId: string): Promise<MeetingReadResult> {
  return getMeeting(meetingId);
}

export async function saveMeetingAgendaAction(meetingId: string, draft: AgendaDraft): Promise<AgendaSaveResult> {
  return saveMeetingAgenda(meetingId, draft, createMeetingAgendaStore());
}
