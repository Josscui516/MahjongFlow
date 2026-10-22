export function getMeetingHref(meetingId: string) {
  return `/meetings/${encodeURIComponent(meetingId)}`;
}

export function getTaskHref(taskId: string) {
  return `/tasks/${encodeURIComponent(taskId)}`;
}

export function getSourceKindLabel() {
  return "Meeting agenda source";
}
