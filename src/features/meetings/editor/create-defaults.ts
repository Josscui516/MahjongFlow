import type { MeetingEditorValues } from "./contracts";
import { formatSydneyDateTimeInput } from "./validation";

export function meetingCreateDefaults(now: Date, userId: string, options: readonly { id: string }[]): MeetingEditorValues {
  return {
    title: "",
    summary: "",
    startsAt: formatSydneyDateTimeInput(now.toISOString()),
    attendeeIds: options.some(option => option.id === userId) ? [userId] : [],
  };
}
