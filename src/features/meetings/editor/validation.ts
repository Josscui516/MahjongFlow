import type { MeetingValidationError } from "@/features/meetings/schemas";

import type { MeetingEditorError, MeetingEditorField, MeetingEditorValues } from "./contracts";

const SYDNEY_LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const FIELD_LABELS: Record<MeetingEditorField, string> = {
  attendeeIds: "Participants",
  startsAt: "Meeting date and time",
  summary: "Summary",
  title: "Meeting title",
};

export function validateMeetingEditor(values: MeetingEditorValues): readonly MeetingEditorError[] {
  const errors: MeetingEditorError[] = [];
  if (!values.title.trim()) errors.push({ field: "title", label: FIELD_LABELS.title, message: "Enter a meeting title." });
  if (!SYDNEY_LOCAL_DATE_TIME.test(values.startsAt)) errors.push({ field: "startsAt", label: FIELD_LABELS.startsAt, message: "Choose a valid date and time." });
  if (values.attendeeIds.length === 0) errors.push({ field: "attendeeIds", label: FIELD_LABELS.attendeeIds, message: "Select at least one committee participant." });
  if (!values.summary.trim()) errors.push({ field: "summary", label: FIELD_LABELS.summary, message: "Add a concise meeting summary." });
  return errors;
}

export function mapMeetingValidationErrors(errors: readonly MeetingValidationError[]): readonly MeetingEditorError[] {
  return errors.map((error) => ({ ...error, label: FIELD_LABELS[error.field] }));
}

export function createSubmissionFingerprint(values: MeetingEditorValues): string {
  return JSON.stringify({ ...values, attendeeIds: [...values.attendeeIds].sort(), summary: values.summary.trim(), title: values.title.trim() });
}

export function formatSydneyDateTimeInput(value: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit", hour: "2-digit", hour12: false, minute: "2-digit",
      month: "2-digit", timeZone: "Australia/Sydney", year: "numeric",
    }).formatToParts(new Date(value)).filter(({ type }) => type !== "literal").map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
