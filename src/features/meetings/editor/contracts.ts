export type MeetingEditorField =
  | "title"
  | "startsAt"
  | "attendeeIds"
  | "summary"
  | "discussionPoints"
  | "decisions";

export type MeetingEditorValues = Readonly<{
  attendeeIds: readonly string[];
  decisions: string;
  discussionPoints: string;
  startsAt: string;
  summary: string;
  title: string;
}>;

export type MeetingRecordDTO = MeetingEditorValues &
  Readonly<{
    id: string;
  }>;

export type MeetingEditorError = Readonly<{
  field: MeetingEditorField;
  label: string;
  message: string;
}>;

export type MeetingEditorStatus =
  | "idle"
  | "duplicate"
  | "success"
  | "system-error"
  | "validation";

export type MeetingEditorResult =
  | Readonly<{ ok: true; record: MeetingRecordDTO }>
  | Readonly<{
      ok: false;
      code: "DUPLICATE" | "SYSTEM_ERROR" | "VALIDATION";
      errors?: readonly MeetingEditorError[];
    }>;

/**
 * UI-facing subset of Li's frozen MeetingEditorPort.
 *
 * The feature consumes this shape at its server boundary during integration;
 * it deliberately does not know about Supabase rows or database clients.
 */
export type MeetingEditorPort = Readonly<{
  createMeeting: (
    values: MeetingEditorValues,
  ) => Promise<MeetingEditorResult>;
  getMeeting: (
    meetingId: string,
  ) => Promise<
    | Readonly<{ ok: true; record: MeetingRecordDTO }>
    | Readonly<{
        ok: false;
        code: "NOT_FOUND" | "PERMISSION_DENIED" | "SYSTEM_ERROR";
      }>
  >;
  updateMeeting: (
    meetingId: string,
    values: MeetingEditorValues,
  ) => Promise<MeetingEditorResult>;
}>;
