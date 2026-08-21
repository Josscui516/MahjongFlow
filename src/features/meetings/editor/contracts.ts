import type { MeetingEditorPort, MeetingRecordDTO } from "@/features/meetings/core/contracts";
import type { MeetingField, MeetingInput } from "@/features/meetings/schemas";

export type { MeetingEditorPort, MeetingRecordDTO };
export type MeetingEditorValues = MeetingInput;
export type MeetingEditorField = MeetingField;

export type MeetingAttendeeOption = Readonly<{ id: string; label: string }>;
export type MeetingEditorError = Readonly<{ field: MeetingEditorField; label: string; message: string }>;
export type MeetingEditorStatus = "idle" | "duplicate" | "permission" | "success" | "system-error" | "validation";
export type MeetingAttendeeOptionsResult =
  | Readonly<{ ok: true; options: readonly MeetingAttendeeOption[] }>
  | Readonly<{ ok: false; code: "PERMISSION_DENIED" | "SYSTEM_ERROR" }>;
