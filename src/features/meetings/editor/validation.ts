import {
  MEETING_SUMMARY_MAX_LENGTH,
  MEETING_TITLE_MAX_LENGTH,
  type MeetingValidationError,
} from "@/features/meetings/schemas";

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
  const title = values.title.trim();
  const summary = values.summary.trim();
  if (!title) errors.push({ field: "title", label: FIELD_LABELS.title, message: "Enter a meeting title." });
  else if (title.length > MEETING_TITLE_MAX_LENGTH) errors.push({ field: "title", label: FIELD_LABELS.title, message: "Use no more than 200 characters." });
  if (!SYDNEY_LOCAL_DATE_TIME.test(values.startsAt)) errors.push({ field: "startsAt", label: FIELD_LABELS.startsAt, message: "Choose a valid date and time." });
  if (values.attendeeIds.length === 0) errors.push({ field: "attendeeIds", label: FIELD_LABELS.attendeeIds, message: "Select at least one committee participant." });
  if (!summary) errors.push({ field: "summary", label: FIELD_LABELS.summary, message: "Add a concise meeting summary." });
  else if (summary.length > MEETING_SUMMARY_MAX_LENGTH) errors.push({ field: "summary", label: FIELD_LABELS.summary, message: "Use no more than 10,000 characters." });
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

export function formatSydneyDateTimeDisplay(value: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    month: "short",
    timeZone: "Australia/Sydney",
    timeZoneName: "short",
    weekday: "short",
    year: "numeric",
  }).format(new Date(value)).replace(/, (?=\d{1,2}:)/, " · ");
}
