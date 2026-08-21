import type { MeetingMutationResult } from "@/features/meetings/core/contracts";

import type {
  MeetingEditorPort,
  MeetingEditorValues,
  MeetingRecordDTO,
} from "./contracts";

type MeetingSubmission = Readonly<
  | { mode: "create" }
  | { initialRecord: MeetingRecordDTO; mode: "update" }
>;

export async function submitMeetingSafely(
  port: MeetingEditorPort,
  submission: MeetingSubmission,
  values: MeetingEditorValues,
): Promise<MeetingMutationResult> {
  try {
    return submission.mode === "create"
      ? await port.createMeeting(values)
      : await port.updateMeeting(submission.initialRecord.id, values);
  } catch {
    return { code: "SYSTEM_ERROR", ok: false };
  }
}
