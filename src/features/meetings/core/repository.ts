import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalisedMeetingInput } from "@/features/meetings/schemas";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.generated";
import type { MeetingHistoryItem, MeetingRecordDTO } from "./contracts";

export class MeetingRepositoryError extends Error {
  constructor(readonly code: string | undefined, message = "Meeting persistence failed") {
    super(message); this.name = "MeetingRepositoryError";
  }
}
type MeetingRow = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingRepository = Readonly<{
  create: (actorId: string, input: NormalisedMeetingInput) => Promise<MeetingRecordDTO>;
  get: (meetingId: string) => Promise<MeetingRecordDTO | null>;
  listHistory: () => Promise<readonly MeetingHistoryItem[]>;
  update: (meetingId: string, input: NormalisedMeetingInput) => Promise<MeetingRecordDTO | null>;
}>;
function fail(error: { code?: string; message: string }): never { throw new MeetingRepositoryError(error.code, error.message); }
async function readMeeting(client: SupabaseClient<Database>, meetingId: string): Promise<MeetingRecordDTO | null> {
  const meeting = await client.from("meetings").select("id, title, starts_at, summary, created_by, created_at, updated_at").eq("id", meetingId).maybeSingle();
  if (meeting.error) fail(meeting.error);
  if (!meeting.data) return null;
  const attendees = await client.from("meeting_attendees").select("profile_id").eq("meeting_id", meetingId).order("profile_id");
  if (attendees.error) fail(attendees.error);
  return { attendeeIds: (attendees.data ?? []).map(({ profile_id }) => profile_id), createdAt: meeting.data.created_at,
    createdBy: meeting.data.created_by, id: meeting.data.id, startsAt: meeting.data.starts_at,
    summary: meeting.data.summary, title: meeting.data.title, updatedAt: meeting.data.updated_at };
}
export function createMeetingRepository(getClient: () => Promise<SupabaseClient<Database>> = createServerSupabaseClient): MeetingRepository {
  return {
    async create(actorId, input) {
      const client = await getClient();
      const result = await client.rpc("create_meeting_record", { attendee_ids: [...input.attendeeIds], meeting_starts_at: input.startsAt, meeting_summary: input.summary, meeting_title: input.title });
      if (result.error) fail(result.error);
      const record = await readMeeting(client, result.data);
      if (!record || record.createdBy !== actorId) throw new MeetingRepositoryError("PGRST116");
      return record;
    },
    async get(meetingId) { return readMeeting(await getClient(), meetingId); },
    async listHistory() {
      const result = await (await getClient()).from("meetings").select("id, title, starts_at, summary").order("starts_at", { ascending: false }).order("id", { ascending: true });
      if (result.error) fail(result.error);
      return (result.data ?? []).map((row: Pick<MeetingRow, "id" | "starts_at" | "summary" | "title">) => ({ id: row.id, startsAt: row.starts_at, summary: row.summary, title: row.title }));
    },
    async update(meetingId, input) {
      const client = await getClient();
      const result = await client.rpc("update_meeting_record", { attendee_ids: [...input.attendeeIds], meeting_id: meetingId, meeting_starts_at: input.startsAt, meeting_summary: input.summary, meeting_title: input.title });
      if (result.error) fail(result.error);
      return result.data ? readMeeting(client, meetingId) : null;
    },
  };
}
