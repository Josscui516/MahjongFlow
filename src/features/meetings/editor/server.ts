import "server-only";

import type { MeetingAgendaDTO } from "@/features/meetings/agenda/contracts";
import { createMeetingAgendaStore } from "@/features/meetings/agenda/persistence";
import { AgendaPersistenceError, getMeetingAgenda } from "@/features/meetings/agenda/service";
import type { MeetingReadResult } from "@/features/meetings/core/contracts";
import { getMeeting } from "@/features/meetings/core/service";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { MeetingAttendeeOptionsResult } from "./contracts";

export async function readMeeting(meetingId: string): Promise<MeetingReadResult> {
  return getMeeting(meetingId);
}

export async function readMeetingAgenda(meetingId: string): Promise<MeetingAgendaDTO | null> {
  try {
    return await getMeetingAgenda(meetingId, createMeetingAgendaStore());
  } catch (error) {
    if (error instanceof AgendaPersistenceError) return null;
    throw error;
  }
}

export async function listMeetingAttendeeOptions(): Promise<MeetingAttendeeOptionsResult> {
  try {
    await requireBackendUser();
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("committee_role", ["committee", "authorised"])
      .order("display_name")
      .order("id");

    if (error) return { ok: false, code: error.code === "42501" ? "PERMISSION_DENIED" : "SYSTEM_ERROR" };
    return { ok: true, options: (data ?? []).map(({ id, display_name }) => ({ id, label: display_name })) };
  } catch (error) {
    return { ok: false, code: error instanceof AuthorizationError ? "PERMISSION_DENIED" : "SYSTEM_ERROR" };
  }
}
