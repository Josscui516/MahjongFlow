import type {
  MeetingEditorError,
  MeetingEditorValues,
} from "./contracts";

const SYDNEY_LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function validateMeetingEditor(
  values: MeetingEditorValues,
): readonly MeetingEditorError[] {
  const errors: MeetingEditorError[] = [];

  if (!values.title.trim()) {
    errors.push({
      field: "title",
      label: "Meeting title",
      message: "Enter a meeting title.",
    });
  }

  if (!SYDNEY_LOCAL_DATE_TIME.test(values.startsAt)) {
    errors.push({
      field: "startsAt",
      label: "Meeting date and time",
      message: "Choose a valid date and time.",
    });
  }

  if (values.attendeeIds.length === 0) {
    errors.push({
      field: "attendeeIds",
      label: "Participants",
      message: "Select at least one committee participant.",
    });
  }

  if (!values.discussionPoints.trim()) {
    errors.push({
      field: "discussionPoints",
      label: "Discussion points",
      message: "Add at least one discussion point.",
    });
  }

  if (!values.decisions.trim()) {
    errors.push({
      field: "decisions",
      label: "Decisions",
      message: "Record at least one decision.",
    });
  }

  if (!values.summary.trim()) {
    errors.push({
      field: "summary",
      label: "Summary",
      message: "Add a concise meeting summary.",
    });
  }

  return errors;
}

export function createSubmissionFingerprint(
  values: MeetingEditorValues,
): string {
  return JSON.stringify({
    ...values,
    attendeeIds: [...values.attendeeIds].sort(),
    decisions: values.decisions.trim(),
    discussionPoints: values.discussionPoints.trim(),
    summary: values.summary.trim(),
    title: values.title.trim(),
  });
}
